// src/hooks/useData.ts
import { useState, useEffect } from 'react';
import { DataItem } from '../App';
import { GameService } from '../services/gameService';

const useData = (): [DataItem[], boolean, React.Dispatch<React.SetStateAction<DataItem[]>>] => {
    const [data, setData] = useState<DataItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Use the new API to fetch games in legacy format for compatibility
                const games = await GameService.getLegacyGames();
                if (Array.isArray(games)) {
                    setData(games);
                } else {
                    console.error("Expected response to be an array but received:", games);
                }
            } catch (error) {
                console.error("Error loading data:", error);
                // If user is not authenticated, the interceptor will redirect to login
                // For other errors, we'll just log them and show empty data
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    return [data, loading, setData];
};

export default useData;
