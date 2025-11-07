// backend/app.js
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({ origin: "http://localhost:3001" })); // For local dev

const pool = require("./helpers/dbConnecter");
const calculateRisk = require("./helpers/riskEvaluator");

app.post("/api/query", async (req, res) => {
  const { query } = req.body;
  const risk = calculateRisk(req);

  try {
    const [rows] = await pool.query(query);

    // Mask sensitive data if risk is high
    const maskedRows = rows.map((row) => {
      if (risk.masked) {
        const copy = { ...row };
        for (const key of Object.keys(copy)) {
          const lower = key.toLowerCase();
          if (lower.includes("ssn") || lower.includes("creditcard") || lower.includes("password")) {
            copy[key] = "****MASKED****";
          }
        }
      return copy;
      }
      return row;
  });
    console.log("Risk results sent to client:", risk);
    res.json({ risk, rows: maskedRows });
  } catch (error) {
    console.error("SQL error:", error);
    res.status(500).json({ error: "SQL Query Failed", details: error.message });
  }
});


// For deployment: serve the React build folder
const frontendPath = path.join(__dirname, "../frontend/build");
app.use(express.static(frontendPath));

// Works in Express 5+
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });  

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});