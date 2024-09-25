// src/hooks/useData.ts
import { useState, useEffect } from 'react';
import axios from 'axios';
import { DataItem } from '../App';

const useData = (): [DataItem[], boolean, React.Dispatch<React.SetStateAction<DataItem[]>>] => {
    const [data, setData] = useState<DataItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const response = await axios.get<DataItem[]>('http://localhost:8000/data/data.parquet');
                if (Array.isArray(response.data)) {
                    setData(response.data);
                } else {
                    console.error("Expected response to be an array but received:", response.data);
                }
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    return [data, loading, setData];
};

export default useData;
