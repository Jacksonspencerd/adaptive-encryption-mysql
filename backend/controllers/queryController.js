// controllers/queryController.js

const pool = require("../helpers/dbConnecter");
const { getMaskLevel, applyMasking } = require("../helpers/masking");

// Simple destructive-SQL guard
function isDestructiveQuery(sql) {
  if (!sql) return true;

  const forbidden = /\b(drop|delete|truncate|alter|update|insert|create|replace)\b/i;
  return forbidden.test(sql);
}

exports.runQuery = async (req, res) => {
  const { query } = req.body;

  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'query' string in body" });
  }

  // Hard-deny destructive queries from this API
  if (isDestructiveQuery(query)) {
    return res.status(400).json({
      error: "Destructive queries (DROP, DELETE, ALTER, etc.) are not allowed through this endpoint",
    });
  }

  // Hard-deny for "threat" role
  if (req.user.role === "threat") {
    return res.status(403).json({
      error: "Access denied for threat role",
    });
  }

  try {
    // Execute SQL (read-only, thanks to the guard above)
    const [rows] = await pool.query(query);

    // Compute mask level using role + risk (set by riskEvaluator middleware)
    const maskLevel = getMaskLevel(req.user.role, req.riskLevel);

    // Apply masking to each row
    const maskedRows = rows.map((row) => applyMasking(row, maskLevel));

    res.json({
      role: req.user.role,
      threatScore: req.threatScore,
      riskLevel: req.riskLevel,
      maskLevel,
      rows: maskedRows,
    });
  } catch (err) {
    console.error("SQL error:", err);
    res.status(500).json({
      error: "Query failed",
      details: err.message,
    });
  }
};
