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
        device,
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
    <div className="container py-4">

      {/* Header / Navbar */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Context-Aware DDM Dashboard</h2>

        <button
          className="btn btn-outline-danger"
          onClick={() => {
            localStorage.clear();
            onLogout();
          }}
        >
          Logout
        </button>
      </div>

      {/* User info */}
      <div className="mb-4">
        <p className="text-muted mb-1">Welcome to the dashboard! You can run SQL queries below.</p>
        <p className="fw-bold">Role: <span className="text-primary">{localStorage.getItem("role")}</span></p>
      </div>

      {/* Query Form */}
      <div className="card shadow-sm p-3 mb-4">
        <h5 className="mb-3">Run SQL Query</h5>
        <QueryForm onQuery={handleQuery} />
      </div>

      {/* Loading / Errors */}
      {loading && <p className="text-info">Running query...</p>}
      {error && <p className="text-danger fw-bold">{error}</p>}

      {/* Risk Score */}
      {results.risk && (
        <div className="alert alert-secondary mt-3">
          <strong>Risk Score:</strong>{" "}
          <span className="fw-bold">{results.risk.threatScore.toFixed(2)}</span>{" "}
          {results.risk.masked && (
            <span className="text-danger ms-2">Masking Applied</span>
          )}
        </div>
      )}

      {/* Results Table */}
      <div className="card shadow-sm p-3 mt-4">
        <h5 className="mb-3">Query Results</h5>
        <ResultsTable data={results.rows || []} />
      </div>

    </div>
  );
}
