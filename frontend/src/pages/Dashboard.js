import QueryForm from "../components/QueryForm";
import ResultsTable from "../components/ResultsTable";
import { useState } from "react";
import client from "../api/client";
import { getDeviceFingerprint } from "../utils/deviceFingerprint";

export default function Dashboard({ onLogout }) {
  const [results, setResults] = useState({ rows: [], risk: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleQuery = async (query) => {
    setLoading(true);
    setError("");

    try {
      const device = getDeviceFingerprint();

      const res = await client.post("/query", { 
        query,
        device,     // send device fingerprint
      });

      setResults(res.data);
    } catch (err) {
      setError("Query failed");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="header">
        <h1>Context-Aware DDM Dashboard</h1>
        <button
          onClick={() => {
            localStorage.clear();
            onLogout();
          }}
        >
          Logout
        </button>
      </div>

      <div>
        <p>Welcome to the dashboard! You can run SQL queries below.</p>
        <p>Role: {localStorage.getItem("role")}</p>
      </div>

      <QueryForm onQuery={handleQuery} />

      {loading && <p>Running query...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {results.risk && (
        <p>
          Risk Score:{" "}
          <strong>{results.risk.threatScore.toFixed(2)}</strong>{" "}
          {results.risk.masked && (
            <span style={{ color: "red" }}>Masking Applied</span>
          )}
        </p>
      )}

      <ResultsTable data={results.rows || []} />
    </div>
  );
}
