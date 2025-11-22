// helpers/riskEvaluator.js
// GitHub Copilot
// Middleware to compute a simple risk/threat score for the current request based on:
// - IP address history (anomaly if current IP not seen recently)
// - Request time vs configured business hours
// - Recent failed login attempts
// - User role privilege (sensitivity)
// The computed score and derived risk level are attached to `req` as `req.threatScore` and `req.riskLevel`.
// On any error or if no authenticated user is present, defaults are applied (score 0, level "none").

const pool = require("./dbConnecter"); // MySQL connection pool using promise interface
const {
  weights,
  thresholds,
  businessHours,
  maxFailedLoginsSafe,
} = require("./threatConfig"); // configuration for scoring, thresholds, etc.

/**
 * Extract the client's IP address from the request.
 * Prefers X-Forwarded-For (first entry) and falls back to socket remoteAddress.
 * Strips IPv6-mapped IPv4 prefix (::ffff:) when present.
 *
 * @param {IncomingMessage} req - Express request
 * @returns {string} ip address or empty string
 */
function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (xff) return xff.split(",")[0].trim();
  // socket may be undefined in some test environments; use optional chaining
  return (req.socket?.remoteAddress || "").replace("::ffff:", "");
}

/**
 * Map a user role to a normalized privilege/sensitivity score (0..1).
 * Higher means more sensitive (contributes more to threat).
 *
 * @param {string} role - role name from req.user
 * @returns {number} privilege score in range [0,1]
 */
function roleToPrivilegeScore(role) {
  const privilege = {
    admin: 1.0,
    analyst: 0.7,
    user: 0.5,
    guest: 0.3,
    threat: 0.1,
  };
  // default to a moderate-low value if unknown role provided
  return privilege[role] ?? 0.3;
}

/**
 * Express middleware to evaluate risk for the incoming request.
 * Attaches `req.threatScore` (number) and `req.riskLevel` (string: none|low|medium|high).
 *
 * Flow:
 *  - If unauthenticated (no req.user), set defaults and continue.
 *  - Fetch recent successful login IPs for the user and mark if current IP is unknown.
 *  - Compute time anomaly based on configured business hours.
 *  - Count recent failed logins (last hour) and normalize against safe threshold.
 *  - Lookup role sensitivity and combine all signals using configured weights.
 *  - Round score to 2 decimals and map to risk level using configured thresholds.
 *  - On any DB or runtime error, log and set safe defaults.
 */
module.exports = async function riskEvaluator(req, res, next) {
  // If there is no authenticated user, treat as no risk and continue.
  if (!req.user) {
    req.threatScore = 0;
    req.riskLevel = "none";
    return next();
  }

  try {
    const userId = req.user.id;
    const role = req.user.role;
    const currentIp = getClientIp(req);

    // --- 1. IP anomaly ------------------------------------------
    // If the current IP is not among the user's last few successful login IPs,
    // mark as unknown. We only consider up to 5 recent successful login IPs.
    let ipUnknown = 0;
    const [ipRows] = await pool.query(
      `SELECT DISTINCT ip_address
       FROM login_audit
       WHERE user_id = ? AND success = 1
       ORDER BY timestamp DESC
       LIMIT 5`,
      [userId]
    );

    if (ipRows.length > 0 && !ipRows.some(r => r.ip_address === currentIp)) {
      ipUnknown = 1;
    }

    // --- 2. Time anomaly -----------------------------------------
    // If the request occurs outside configured business hours, flag it.
    const hour = new Date().getHours();
    const timeAnomaly =
      hour < businessHours.start || hour >= businessHours.end ? 1 : 0;

    // --- 3. Failed logins ----------------------------------------
    // Count failed login attempts for this user during the last hour and
    // normalize to a 0..1 score using maxFailedLoginsSafe.
    const [failRows] = await pool.query(
      `SELECT COUNT(*) AS cnt
       FROM login_audit
       WHERE user_id = ?
         AND success = 0
         AND timestamp > NOW() - INTERVAL 1 HOUR`,
      [userId]
    );

    const fails = failRows[0]?.cnt || 0;
    // prevent division by zero and clamp to 1
    const failedLoginScore = Math.min(fails / maxFailedLoginsSafe, 1);

    // --- 4. Role sensitivity -------------------------------------
    const privilegeScore = roleToPrivilegeScore(role);

    // --- 5. Weighted composite score ------------------------------
    // Combine signals using configured weights. The expected weights object
    // should contain numeric multipliers for each signal.
    const rawScore =
      weights.ipUnknown * ipUnknown +
      weights.timeAnomaly * timeAnomaly +
      weights.failedLogins * failedLoginScore +
      weights.privilege * privilegeScore;

    // Round to 2 decimals for readability/storage
    const threatScore = Number(rawScore.toFixed(2));

    // Map numeric score to risk level using configured thresholds
    let riskLevel = "none";
    if (threatScore >= thresholds.high) riskLevel = "high";
    else if (threatScore >= thresholds.medium) riskLevel = "medium";
    else if (threatScore >= thresholds.low) riskLevel = "low";

    // Attach computed values to the request for downstream middleware/handlers
    req.threatScore = threatScore;
    req.riskLevel = riskLevel;

    next();
  } catch (err) {
    // On error, log and safely continue with no risk
    console.error("riskEvaluator error:", err);
    req.threatScore = 0;
    req.riskLevel = "none";
    next();
  }
};
