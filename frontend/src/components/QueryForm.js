import { useState } from "react";

function QueryForm({ onQuery }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    onQuery(query);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3">
      <div className="mb-3">
        <label className="form-label fw-bold">SQL Query</label>
        <textarea
          className="form-control"
          style={{ fontFamily: "monospace", minHeight: "120px" }}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter SQL query..."
          rows={4}
        />
      </div>

      <button type="submit" className="btn btn-primary w-100">
        Run Query
      </button>
    </form>
  );
}

export default QueryForm;
