const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../helpers/dbConnecter");
const SECRET = process.env.JWT_SECRET || "supersecret_dev_key";

exports.registerUser = async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const [existing] = await pool.query("SELECT id FROM users WHERE username = ?", [username]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
      [username, hash, role || "guest"]
    );

    res.json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
};

exports.loginUser = async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [username]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: "Invalid username or password" });

    const match = await bcrypt.compare(password, user.password_hash);
    await pool.query(
      "INSERT INTO login_audit (user_id, success, ip_address) VALUES (?, ?, ?)",
      [user.id, match, req.ip]
    );

    if (!match) return res.status(401).json({ error: "Invalid username or password" });

    const token = jwt.sign(
      { id: user.id, role: user.role, username: user.username },
      SECRET,
      { expiresIn: "2h" }
    );

    res.json({ token, role: user.role });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
};
