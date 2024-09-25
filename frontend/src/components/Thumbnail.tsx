import React from 'react';
import { Box } from '@mui/material';

interface ThumbnailProps {
    url: string;
    altText: string;
}

const Thumbnail: React.FC<ThumbnailProps> = ({ url, altText }) => {
    return (
        <Box sx={{ width: '16%', marginLeft: 2 }}>
    <img
        src={url}
    alt={altText}
    style={{ width: '100%', height: 'auto', aspectRatio: '16/9' }}
    />
    </Box>
);
};

export default Thumbnail;
