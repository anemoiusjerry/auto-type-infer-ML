export const LazyTable = ({ data, numRows }) => {
    const dataSlice = data.slice(0, numRows);

    return (
        dataSlice.map((row, i) => 
        <tr key={i}>
            {row.map((col, j) => <td key={j}>{col}</td>)}
        </tr>)
    );
};