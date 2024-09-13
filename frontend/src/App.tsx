import React, {useEffect, useState, useCallback} from 'react';
import axios from 'axios';
import DataTable from './components/DataTable';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

// Define the type of your data
interface DataItem {
    name: string;
    rating: number;
    played_flag: boolean;
    hide: boolean;
}

const App: React.FC = () => {
    const [data, setData] = useState<DataItem[]>([]); // Use the DataItem type for the state

    useEffect(() => {
        const loadData = async () => {
            try {
                const response = await axios.get<DataItem[]>('http://localhost:8000/data/data.parquet'); // Specify the response type
                if (Array.isArray(response.data)) {
                    setData(response.data);
                } else {
                    console.error("Expected response to be an array but received:", response.data);
                }
            } catch (error) {
                console.error("Error loading data:", error);
            }
        };

        loadData();
    }, []);

    const handleCheckboxChange = useCallback(async (index: number, columnName: string) => {
        const updatedValue = !data[index][columnName as keyof DataItem]; // Use keyof to ensure columnName is valid

        try {
            await axios.post(`http://localhost:8000/data/data.parquet/update`, {
                column: columnName,
                index: index,
                value: updatedValue,
            });

            setData((prevData) => {
                return prevData.map((item, i) => {
                    if (i === index) {
                        return {...item, [columnName]: updatedValue};
                    }
                    return item;
                });
            });
        } catch (error) {
            console.error("Error updating column value:", error);
        }
    }, [data]);

    return (
        <Container>
            <Typography variant="h4" align="center" marginY={4}>
                Filtered Data
            </Typography>
            <DataTable data={data} onToggleFlag={handleCheckboxChange}/>
        </Container>
    );
};

export default App;