const pool = require("../helpers/dbConnecter");
const calculateRisk = require("../helpers/riskEvaluator");
const threatConfig = require("../helpers/threatConfig");

exports.runQuery = async (req, res) => {
  const { query } = req.body;
  const risk = await calculateRisk(req);

  // if the user is "threat", deny immediately
  if (req.user.role === "threat") {
    return res.status(403).json({ error: "Access denied: threat user" });
  }

  try {
    const [rows] = await pool.query(query);

    // Apply masking based on risk and role
    const maskedRows = rows.map((row) => {
      if (risk.masked || ["user", "guest", "threat"].includes(req.user.role)) {
        return Object.fromEntries(
          Object.entries(row).map(([k, v]) => [k, typeof v === "string" ? "***MASKED***" : v])
        );
      }
      return row;
    });

    res.json({ rows: maskedRows, risk });
  } catch (err) {
    console.error("SQL error:", err);
    res.status(500).json({ error: "Query failed", details: err.message });
  }
};
