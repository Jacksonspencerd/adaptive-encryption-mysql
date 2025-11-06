// backend/app.js
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({ origin: "http://localhost:3001" })); // For local dev

// Example query endpoint
app.post("/api/query", async (req, res) => {
  const { query } = req.body;
  console.log("Received query:", query);

  // Simulate masking behavior (for demo)
  const rows = [
    { employee_name: "Alice", salary: "***MASKED***", department: "HR" },
    { employee_name: "Bob", salary: "***MASKED***", department: "Finance" },
  ];

  res.json({ rows });
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