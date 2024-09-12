import React from "react";
import { useTable, useSortBy } from "react-table";

const DataTable = ({ data, onToggleFlag }) => {
  const columns = React.useMemo(
    () => [
      {
        Header: "Name",
        accessor: "name",
      },
      {
        Header: "Rating",
        accessor: "rating",
      },
      {
        Header: "Played",
        accessor: "played",
        Cell: ({ value, row }) => (
          <input
            type="checkbox"
            checked={value}
            onChange={() => onToggleFlag(row.index, "played")} // Call the toggle function with row index
          />
        ),
      },
      {
        Header: "Hide",
        accessor: "hide",
        Cell: ({ value, row }) => (
          <input
            type="checkbox"
            checked={value}
            onChange={() => onToggleFlag(row.index, "hide")} // Updated to pass column name
          />
        ),
      },
    ],
    [onToggleFlag] // Make sure to check this
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable(
      {
        columns,
        data,
      },
      useSortBy // Include sorting
    );

  return (
    <table {...getTableProps()} style={{ border: "solid 1px black" }}>
      <thead>
        {headerGroups.map((headerGroup) => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column) => (
              <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                {column.render("Header")}
                <span>
                  {column.isSorted
                    ? column.isSortedDesc
                      ? " 🔽" // Descending
                      : " 🔼" // Ascending
                    : ""}
                </span>
              </th>
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
  );
};

export default DataTable;
