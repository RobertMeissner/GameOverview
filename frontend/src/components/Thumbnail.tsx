import React from 'react';
import { Box } from '@mui/material';

interface ThumbnailProps {
    url: string;
    altText: string;
}

const Thumbnail: React.FC<ThumbnailProps> = ({ url, altText }) => {
    return (
        <Box sx={{ width: 50, height: 50, marginRight: 2 }}>
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
