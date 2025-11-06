function ResultsTable({ data }) {
    if (!data || data.length === 0) {
      return <p>No results to display.</p>;
    }
  
    const columns = Object.keys(data[0]);
  
    return (
      <table border="1" cellPadding="5" style={{ width: "100%", marginTop: "16px" }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {columns.map((col) => (
                <td key={col}>{row[col]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  
  export default ResultsTable;
  