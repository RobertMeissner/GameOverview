import React, { useEffect, useState } from "react";
import axios from "axios";
import { useTable } from "react-table";

const App = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const loadParquetFile = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8000/data/data.parquet"
        );

        console.log(response.data); // Log the response to debug
        const jsonData = response.data; // Assuming response is already in JSON format
        setData(jsonData);
      } catch (error) {
        console.error("Error loading parquet file:", error);
      }
    };

    loadParquetFile();
  }, []);
  // Function to handle changes in the played_flag column
  const handleCheckboxChange = (index) => {
    // Use setData to create a new array that updates the 'played_flag' for the specific row
    setData((prevData) => {
      const newData = prevData.map((item, i) => {
        if (i === index) {
          return { ...item, played: !item.played }; // Toggle the played_flag
        }
        return item; // Keep the rest of the items unchanged
      });
      return newData;
    });
  };

  // Table columns definition
  const columns = React.useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]).map((key) => ({
      Header: key,
      accessor: key,
      Cell: ({ row, column }) => {
        if (column.id === "played") {
          return (
            <input
              type="checkbox"
              checked={row.values[column.id]} // Make checkbox checked based on the state
              onChange={() => handleCheckboxChange(row.index)} // Toggle checkbox on change
            />
          );
        }
        return row.values[column.id]; // Render normally for other columns
      },
    }));
  }, [data]);

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable({ columns, data });

  return (
    <div>
      <h1>Filtered Data</h1>
      <table {...getTableProps()} style={{ border: "solid 1px black" }}>
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps()}>{column.render("Header")}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell) => (
                  <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default App;
