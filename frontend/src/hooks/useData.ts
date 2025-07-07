// src/hooks/useData.ts
import { useState, useEffect } from 'react';
import { DataItem } from '../App';
import { GameService } from '../services/gameService';
import { useAuth } from '../context/AuthContext';

const useData = (): [DataItem[], boolean, React.Dispatch<React.SetStateAction<DataItem[]>>] => {
    const [data, setData] = useState<DataItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const { isAuthenticated, isLoading: authLoading } = useAuth();

    useEffect(() => {
        const loadData = async () => {
            // Don't load data if still checking authentication or not authenticated
            if (authLoading || !isAuthenticated) {
                setLoading(false);
                return;
            }

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
                // For errors, we'll just log them and show empty data
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [isAuthenticated, authLoading]); // Re-run when authentication status changes

    return [data, loading, setData];
};

export default useData;
