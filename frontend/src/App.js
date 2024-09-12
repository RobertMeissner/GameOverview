import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import DataTable from "./components/DataTable";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

const App = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8000/data/data.parquet"
        );

        const jsonData = response.data; // Assuming response is already in JSON format
        setData(jsonData);
      } catch (error) {
        console.error("Error loading parquet file:", error);
      }
    };

    loadData();
  }, []);
  // Function to handle changes in played_flag and hide
  const handleCheckboxChange = useCallback(
    async (index, columnName) => {
      const updatedValue = !data[index][columnName]; // Toggle the specified column

      try {
        // Send the request to update the backend
        await axios.post(`http://localhost:8000/data/data.parquet/update`, {
          column: columnName,
          index: index,
          value: updatedValue,
        });

        // Update local data to reflect the change, keeping all other properties intact
        setData((prevData) => {
          const newData = [...prevData]; // Create a shallow copy
          newData[index] = { ...newData[index], [columnName]: updatedValue }; // Update only the specific row and column
          return newData; // Return updated state
        });
      } catch (error) {
        console.error("Error updating column value:", error);
      }
    },
    [data]
  ); // Add data as a dependency

  return (
    <Container>
      <Typography variant="h4" align="center" marginY={4}>
        Filtered Data
      </Typography>
      <DataTable data={data} onToggleFlag={handleCheckboxChange} />
    </Container>
  );
};

export default App;
