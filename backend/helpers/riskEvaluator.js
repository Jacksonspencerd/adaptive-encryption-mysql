// backend/helpers/riskEvaluator.js
// Calculates contextual risk based on user, login history, and environment

const pool = require("./dbConnecter");
const threatConfig = require("./threatConfig");
const knownIPs = ["127.0.0.1", "::1"];

async function calculateRisk(req) {
  const { weights, threshold } = threatConfig;
  let riskScore = 0.0;

  // -------------------------------
  // IP Reputation / Source
  // -------------------------------
  const ip = req.ip || req.connection?.remoteAddress || "";
  const ipUnknown = !knownIPs.includes(ip);
  if (ipUnknown) riskScore += weights.ipReputation || weights.ipUnknown;

  // -------------------------------
  // Time-based anomalies
  // -------------------------------
  const hour = new Date().getHours();
  const timeAnomaly = hour < 6 || hour > 22; // 10PM–6AM window
  if (timeAnomaly) riskScore += weights.timeAnomaly;

  // -------------------------------
  // Failed logins (from DB)
  // -------------------------------
  let failedLogins = 0;
  try {
    if (req.user?.id) {
      const [rows] = await pool.query(
        `SELECT COUNT(*) AS failures
         FROM login_audit
         WHERE user_id = ? AND success = 0
         AND timestamp >= NOW() - INTERVAL 1 HOUR`,
        [req.user.id]
      );
      failedLogins = rows[0].failures || 0;
    }
  } catch (err) {
    console.error("RiskEvaluator DB error:", err.message);
  }
  const excessiveFailures = failedLogins >= 3;
  if (excessiveFailures) riskScore += weights.failedLogins;

  // -------------------------------
  // Privilege level
  // -------------------------------
  const privilegeLevel = req.user?.role || "guest";
  const elevatedPrivilege =
    privilegeLevel === "admin" ||
    privilegeLevel === "analyst" ||
    privilegeLevel === "superuser";

  if (elevatedPrivilege) riskScore += weights.privilegeLevel;

  // -------------------------------
  // Normalize
  // -------------------------------
  if (riskScore > 1) riskScore = 1;

  return {
    riskScore: Number(riskScore.toFixed(2)),
    masked: riskScore >= threshold,
    details: {
      ip,
      ipUnknown,
      timeAnomaly,
      failedLogins,
      privilegeLevel,
      elevatedPrivilege,
    },
  };
}

module.exports = calculateRisk;
