import React, { createContext, useState, useContext, useCallback, PropsWithChildren } from 'react';
import axios from 'axios';

interface ThumbnailContextType {
    thumbnails: { [key: number]: string };
    fetchThumbnail: (appId: number) => void;
}

const ThumbnailContext = createContext<ThumbnailContextType | undefined>(undefined);

export const ThumbnailProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
    const [thumbnails, setThumbnails] = useState<{ [key: number]: string }>({});

    const fetchThumbnail = useCallback(async (appId: number) => {
        if (!thumbnails[appId]) {
            try {
                const response = await axios.get<Blob>(`http://localhost:8000/thumbnail/${appId}`, { responseType: 'blob' });
                const url = URL.createObjectURL(response.data);
                setThumbnails(prev => ({ ...prev, [appId]: url }));
            } catch (error) {
                console.error(`Failed to fetch thumbnail for app_id ${appId}:`, error);
            }
        }
    }, [thumbnails]);

    return (
        <ThumbnailContext.Provider value={{ thumbnails, fetchThumbnail }}>
            {children}
        </ThumbnailContext.Provider>
    );
};

export const useThumbnailsContext = (): ThumbnailContextType => {
    const context = useContext(ThumbnailContext);
    if (!context) {
        throw new Error("useThumbnailsContext must be used within a ThumbnailProvider");
    }
    return context;
};
