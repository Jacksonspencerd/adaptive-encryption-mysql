import { useState } from "react";
import client from "./api/client";
import QueryForm from "./components/QueryForm";
import ResultsTable from "./components/ResultsTable";
import "./App.css";

function App() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleQuery = async (query) => {
    try {
      setLoading(true);
      setError("");
      const res = await client.post("/query", { query });
      setResults(res.data.rows || []);
    } catch (err) {
      console.error(err);
      setError("Error running query");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <h1>Context-Aware Dynamic Data Masking</h1>
      <QueryForm onQuery={handleQuery} />
      {loading && <p>Running query...</p>}
      {error && <p className="error">{error}</p>}
      <ResultsTable data={results} />
    </div>
  );
}

export default App;
