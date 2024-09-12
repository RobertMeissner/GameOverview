import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Checkbox,
  Paper,
} from "@mui/material";

const DataTable = ({ data, onToggleFlag }) => {
  const columns = [
    { id: "name", label: "Name" },
    { id: "rating", label: "Rating" },
    { id: "review_score", label: "Steam Score" },
    { id: "played", label: "Played" },
    { id: "hide", label: "Hide" },
  ];

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.id}>
                <TableSortLabel>{column.label}</TableSortLabel>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.length ? (
            data.map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={column.id}>
                    {column.id === "played" ? (
                      <Checkbox
                        checked={row[column.id]}
                        onChange={() => onToggleFlag(index, "played")}
                      />
                    ) : column.id === "hide" ? (
                      <Checkbox
                        checked={row[column.id]}
                        onChange={() => onToggleFlag(index, "hide")}
                      />
                    ) : (
                      row[column.id]
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length}>No data available</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DataTable;
