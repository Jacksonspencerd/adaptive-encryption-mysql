import { useState } from "react";
import client from "../api/client";
import { getDeviceFingerprint } from "../utils/deviceFingerprint";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const device = getDeviceFingerprint();

      const res = await client.post("/auth/login", {
        username,
        password,
        device,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);

      onLogin();
    } catch (err) {
      console.error(err);
      setError("Invalid username or password");
    }
  }

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="card shadow-sm p-4" style={{ width: "350px" }}>
        <h3 className="text-center mb-3">Sign In</h3>

        {error && (
          <div className="alert alert-danger py-2">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-100 mt-2">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
