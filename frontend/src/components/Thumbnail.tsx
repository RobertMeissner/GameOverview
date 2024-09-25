import React from 'react';
import { Box } from '@mui/material';

interface ThumbnailProps {
    url: string;
    altText: string;
    sizeMultiplier?: number; // Optional prop
}

const Thumbnail: React.FC<ThumbnailProps> = ({ url, altText, sizeMultiplier = 1 }) => {
    const width = 50 * sizeMultiplier; // Default width of 50px, multiplied by sizeMultiplier
    const height = (width / 16) * 9; // Calculate height based on 16:9 aspect ratio

    return (
        <Box sx={{ width: width, height: height, marginRight: 2 }}>
            {url ? (
                <img
                    src={url}
                    alt={altText}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', aspectRatio:"16/9" }}
                />
            ) : (
                <Box sx={{ width: '100%', height: '100%', backgroundColor: 'grey' }}></Box>
            )}
        </Box>
    );
};

export default Thumbnail;
