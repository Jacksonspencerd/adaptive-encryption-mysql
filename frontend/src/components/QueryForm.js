import { useState } from "react";

function QueryForm({ onQuery }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    onQuery(query);
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Enter SQL query..."
        rows={4}
        style={{ width: "100%", fontFamily: "monospace" }}
      />
      <button type="submit" style={{ marginTop: "8px" }}>
        Run Query
      </button>
    </form>
  );
}

export default QueryForm;
