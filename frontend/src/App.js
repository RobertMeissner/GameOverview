import React, { useEffect, useState } from "react";
import axios from "axios";
import DataTable from "./components/DataTable";

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
  const handleCheckboxChange = async (index) => {
    const updatedValue = !data[index]["played"];
    // Send update to the backend
    await axios.post(`http://localhost:8000/data/data.parquet/update`, {
      column: "played",
      index: index,
      value: updatedValue,
    });

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

  return (
    <div>
      <h1>Filtered Data</h1>
      <DataTable data={data} onToggleFlag={handleCheckboxChange} />
    </div>
  );
};

export default App;
