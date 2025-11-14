// api/query

const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");
const riskEvaluator = require("../helpers/riskEvaluator");
const { runQuery } = require("../controllers/queryController");


router.post("/", authenticateToken, riskEvaluator, runQuery);

module.exports = router;
