// backend/helpers/dbConnecter.js
require("dotenv").config();
const mysql = require("mysql2/promise");

// Create a MySQL connection pool using mysql2/promise
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "caddm_db",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Export the pool
module.exports = pool;
