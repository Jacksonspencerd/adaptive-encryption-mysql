import QueryForm from "../components/QueryForm";
import ResultsTable from "../components/ResultsTable";
import { useState } from "react";
import client from "../api/client";

export default function Dashboard({ onLogout }) {
  const [results, setResults] = useState({ rows: [], risk: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleQuery = async (query) => {
    setLoading(true);
    setError("");
    try {
      const res = await client.post("/query", { query });
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
        <button onClick={() => { localStorage.clear(); onLogout(); }}>Logout</button>
      </div>

      <QueryForm onQuery={handleQuery} />
      {loading && <p>Running query...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {results.risk && (
        <p>
          Risk Score:{" "}
          <strong>{results.risk.riskScore}</strong>{" "}
          {results.risk.masked && (
            <span style={{ color: "red" }}>⚠ Masking Applied</span>
          )}
        </p>
      )}

      <ResultsTable data={results.rows || []} />
    </div>
  );
}
