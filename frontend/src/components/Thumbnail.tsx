import React from 'react';
import { Box } from '@mui/material';

interface ThumbnailProps {
    url: string;
    altText: string;
    sizeMultiplier?: number; // Optional prop
}

const Thumbnail: React.FC<ThumbnailProps> = ({ url, altText, sizeMultiplier = 1 }) => {
    const size = 50 * sizeMultiplier; // Default size of 50px, multiplied by sizeMultiplier
    return (
        <Box sx={{ width: size, height: size, marginRight: 2 }}>
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
