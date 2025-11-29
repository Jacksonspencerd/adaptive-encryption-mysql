function ResultsTable({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-muted mt-3">No results to display.</p>;
  }

  const columns = Object.keys(data[0]);

  return (
    <div className="table-responsive mt-4">
      <table className="table table-striped table-hover align-middle">
        <thead className="table-light">
          <tr>
            {columns.map((col) => (
              <th key={col} scope="col" className="text-uppercase small fw-bold">
                {col}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((col) => (
                <td key={col}>{row[col]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ResultsTable;
