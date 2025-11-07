// api/query

const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");
const { runQuery } = require("../controllers/queryController");

router.post("/", authenticateToken, runQuery);

module.exports = router;
