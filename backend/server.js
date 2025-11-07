// backend/server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const queryRoutes = require("./routes/queryRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: "http://localhost:3001" }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/query", queryRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("Context-Aware DDM Backend Running");
});

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
