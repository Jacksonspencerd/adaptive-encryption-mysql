import { useState } from "react";
import client from "./api/client";
import QueryForm from "./components/QueryForm";
import ResultsTable from "./components/ResultsTable";
import "./App.css";

function App() {
  const [results, setResults] = useState({ rows: [], risk: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleQuery = async (query) => {
    try {
      setLoading(true);
      setError("");
      const res = await client.post("/query", { query });
      console.log("Response data:", res.data);
      setResults(res.data);
    } catch (err) {
      console.error(err);
      setError("Error running query");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <h1>Context-Aware DDM</h1>
      <QueryForm onQuery={handleQuery} />
      {loading && <p>Running query...</p>}
      {error && <p className="error">{error}</p>}
      {results.risk && (
        <p>
          Risk Score: <strong>{results.risk.score}</strong>{" "}
          {results.risk.masked && (
            <span style={{ color: "red" }}>Masking Applied Due to High Risk</span>
          )}
        </p>
      )}
      <ResultsTable data={results.rows || []} />
    </div>
  );
}

export default App;
