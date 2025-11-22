// helpers/riskEvaluator.js
// Middleware to compute a simple risk/threat score for the current request based on:
// - IP address history (anomaly if current IP not seen recently)
// - Request time vs configured business hours
// - Recent failed login attempts
// - User role privilege (sensitivity)
// - Device fingerprint anomaly (new/unknown device)
// Attaches `req.threatScore` and `req.riskLevel` (none|low|medium|high).

const pool = require("./dbConnecter");
const {
  weights,
  thresholds,
  businessHours,
  maxFailedLoginsSafe,
} = require("./threatConfig");
const { hashDevice } = require("./deviceFingerprint");

/**
 * Extract the client's IP address from the request.
 */
function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (xff) return xff.split(",")[0].trim();
  return (req.socket?.remoteAddress || "").replace("::ffff:", "");
}

/**
 * Map a user role to a normalized privilege/sensitivity score (0..1).
 */
function roleToPrivilegeScore(role) {
  const privilege = {
    admin: 1.0,
    analyst: 0.7,
    user: 0.5,
    guest: 0.3,
    threat: 0.1,
  };
  return privilege[role] ?? 0.3;
}

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
    let ipUnknown = 0;
    const [ipRows] = await pool.query(
      `SELECT DISTINCT ip_address
       FROM login_audit
       WHERE user_id = ? AND success = 1
       ORDER BY timestamp DESC
       LIMIT 5`,
      [userId]
    );

    if (ipRows.length > 0 && !ipRows.some((r) => r.ip_address === currentIp)) {
      ipUnknown = 1;
    }

    // --- 2. Time anomaly -----------------------------------------
    const hour = new Date().getHours();
    const timeAnomaly =
      hour < businessHours.start || hour >= businessHours.end ? 1 : 0;

    // --- 3. Failed logins ----------------------------------------
    const [failRows] = await pool.query(
      `SELECT COUNT(*) AS cnt
       FROM login_audit
       WHERE user_id = ?
         AND success = 0
         AND timestamp > (NOW() - INTERVAL 1 HOUR)`,
      [userId]
    );

    const fails = failRows[0]?.cnt || 0;
    const failedLoginScore = Math.min(
      maxFailedLoginsSafe > 0 ? fails / maxFailedLoginsSafe : 0,
      1
    );

    // --- 4. Device anomaly ---------------------------------------
    // Expect the frontend to send req.body.device when calling /query
    let deviceAnomaly = 0;
    const device = req.body?.device;

    if (device && typeof device === "object") {
      const deviceHash = hashDevice(device);

      // See if this device is already known for this user
      const [knownDevices] = await pool.query(
        `SELECT id FROM user_devices
         WHERE user_id = ? AND device_hash = ?`,
        [userId, deviceHash]
      );

      if (knownDevices.length === 0) {
        // Unknown/new device -> anomaly
        deviceAnomaly = 1;

        // Optionally register this device as "known" for future requests
        await pool.query(
          `INSERT INTO user_devices (user_id, device_hash)
           VALUES (?, ?)`,
          [userId, deviceHash]
        );
      } else {
        deviceAnomaly = 0;
        // Update last_seen
        await pool.query(
          `UPDATE user_devices SET last_seen = CURRENT_TIMESTAMP WHERE id = ?`,
          [knownDevices[0].id]
        );
      }
    }

    // --- 5. Role sensitivity -------------------------------------
    const privilegeScore = roleToPrivilegeScore(role);

    // --- 6. Weighted composite score -----------------------------
    const rawScore =
      (weights.ipUnknown || 0) * ipUnknown +
      (weights.timeAnomaly || 0) * timeAnomaly +
      (weights.failedLogins || 0) * failedLoginScore +
      (weights.privilege || 0) * privilegeScore +
      (weights.deviceChange || 0) * deviceAnomaly;

    const threatScore = Number(rawScore.toFixed(2));

    // Map score to level
    let riskLevel = "none";
    if (threatScore >= thresholds.high) riskLevel = "high";
    else if (threatScore >= thresholds.medium) riskLevel = "medium";
    else if (threatScore >= thresholds.low) riskLevel = "low";

    req.threatScore = threatScore;
    req.riskLevel = riskLevel;

    console.log(
      `Computed threat score: ${threatScore} Risk level: ${riskLevel}`
    );

    next();
  } catch (err) {
    console.error("riskEvaluator error:", err);
    req.threatScore = 0;
    req.riskLevel = "none";
    next();
  }
};
