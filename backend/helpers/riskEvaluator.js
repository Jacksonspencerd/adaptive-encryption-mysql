// helpers/riskEvaluator.js
const pool = require("./dbConnecter");
const {
  weights,
  thresholds,
  businessHours,
  maxFailedLoginsSafe,
} = require("./threatConfig");

function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (xff) return xff.split(",")[0].trim();
  return (req.socket?.remoteAddress || "").replace("::ffff:", "");
}

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

    if (ipRows.length > 0 && !ipRows.some(r => r.ip_address === currentIp)) {
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
         AND timestamp > NOW() - INTERVAL 1 HOUR`,
      [userId]
    );

    const fails = failRows[0]?.cnt || 0;
    const failedLoginScore = Math.min(fails / maxFailedLoginsSafe, 1);

    // --- 4. Role sensitivity -------------------------------------
    const privilegeScore = roleToPrivilegeScore(role);

    // --- 5. Weighted composite score ------------------------------
    const rawScore =
      weights.ipUnknown * ipUnknown +
      weights.timeAnomaly * timeAnomaly +
      weights.failedLogins * failedLoginScore +
      weights.privilege * privilegeScore;

    const threatScore = Number(rawScore.toFixed(2));

    let riskLevel = "none";
    if (threatScore >= thresholds.high) riskLevel = "high";
    else if (threatScore >= thresholds.medium) riskLevel = "medium";
    else if (threatScore >= thresholds.low) riskLevel = "low";

    req.threatScore = threatScore;
    req.riskLevel = riskLevel;

    next();
  } catch (err) {
    console.error("riskEvaluator error:", err);
    req.threatScore = 0;
    req.riskLevel = "none";
    next();
  }
};
