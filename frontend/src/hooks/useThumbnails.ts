// src/hooks/useThumbnails.ts
import { useState, useEffect } from 'react';
import axios from 'axios';
import { DataItem } from '../App';

const useThumbnails = (data: DataItem[], loading: boolean): { [key: number]: string } => {
    const [thumbnails, setThumbnails] = useState<{ [key: number]: string }>({});

    useEffect(() => {
        if (!loading) {
            const fetchThumbnails = async () => {
                const items = data.filter(item => !item.hide && !item.played).slice(0, 3);
                try {
                    const results = await Promise.all(
                        items.map(async item => {
                            const response = await axios.get<Blob>(`http://localhost:8000/thumbnail/${item.app_id}`, { responseType: 'blob' });
                            const url = URL.createObjectURL(response.data);
                            return { app_id: item.app_id, url };
                        })
                    );
                    const newThumbnails: { [key: number]: string } = {};

                    results.forEach(result => {
                        newThumbnails[result.app_id] = result.url;
                    });
                    setThumbnails(newThumbnails);
                } catch (error) {
                    console.error("Failed to fetch thumbnails:", error);
                }
            };

            fetchThumbnails();
        }
    }, [loading, data]);

    return thumbnails;
};

export default useThumbnails;
