import React, {useEffect} from 'react';
import {Box, Checkbox, IconButton, ListItemButton, ListItemText, styled, Typography} from '@mui/material';
import Thumbnail from './Thumbnail';
import {DataItem} from '../App';
import {useThumbnailsContext} from '../context/ThumbnailContext';
import {StoreURL} from "./StoreURL";
import {PlayArrow, VisibilityOff} from "@mui/icons-material";

interface TopThreeListItemProps {
    item: DataItem;
    onDataChange: (hash: string, columnName: keyof DataItem, value: any) => void;
}

const ThumbnailContainer = styled(Box)`
    position: relative;
    width: 100%;
    max-width: 400px; /* Set maximum width */
    padding-top: 56.25%; /* 16:9 Aspect Ratio (9/16 = 0.5625) */
    background-image: url(${(props: { url: string }) => props.url});
    background-size: cover;
    background-position: center;
    border-radius: 8px; // Optional, for rounded corners
    margin: 0.5rem; // Reduced margin between tiles
`;

const TopThreeListItem: React.FC<TopThreeListItemProps> = ({ item, onDataChange }) => {
    const { thumbnails, fetchThumbnail } = useThumbnailsContext();

    useEffect(() => {
        fetchThumbnail(item.app_id); // Ensure thumbnail is loaded for the item
    }, [item.app_id, fetchThumbnail]);

    return (
        <ListItemButton
    key={item.game_hash}
    component="a"
    href={item.storeLink ? item.storeLink : item.app_id ? `https://store.steampowered.com/app/${item.app_id}` : ""}
    target="_blank" // Open link in a new tab
    rel="noopener noreferrer" // Security best practice
    sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        textDecoration: 'none', // Remove underline from link
        width: '100%', // Ensure full width for the button
        maxWidth: '400px', // Set max width
        padding: 0, // Remove padding to reduce height
        height: 'auto', // Allow height to adjust based on content
        mb: 0,
        boxShadow: 'none', // Remove box shadow if any
        border: 'none', // Remove border if your button has one
        '&:hover': {
            backgroundColor: 'transparent', // Optional: keep the background consistent on hover
        }
    }}
>
        <ThumbnailContainer url={thumbnails[item.app_id] || ''}>
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end', // Align text at the bottom
                    padding: 0.5,
                    background: 'rgba(0, 0, 0, 0.5)', // Slight background to improve readability
                    borderRadius: '8px', // Match container to avoid sharp edges when the background is applied
                }}
            >
                <ListItemText
                    primary={
                        <Typography
                            variant="body1"
                            sx={{
                                color: 'white',
                                fontWeight: 'bold',
                                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)', // Shadow for readability
                                mb:0
                            }}
                        >
                            {item.name}
                        </Typography>
                    }
                    secondary={
                        <Typography
                            variant="caption"
                            sx={{
                                color: 'white',
                                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)', // Shadow for readability
                                fontWeight: 'bold',
                                mb: 0,
                            }}
                        >
                            Rating: {item.rating.toPrecision(2)} / Name: {item.found_game_name}
                        </Typography>
                    }
                />
                <Box sx={{ display: 'flex', alignItems: 'center', marginTop: 0.25 }}>
                    <IconButton
                        sx={{ color: item.played ? 'primary.main' : 'white' }}
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent the link from being followed
                            onDataChange(item.game_hash, 'played', !item.played);
                        }}
                    >
                        <PlayArrow />
                    </IconButton>
                    <Typography variant="caption" sx={{ marginLeft: 0.5, color: 'white' }}>Played</Typography>
                    <IconButton
                        sx={{ color: item.hide ? 'primary.main' : 'white' }}
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent the link from being followed
                            onDataChange(item.game_hash, 'hide', !item.hide);
                        }}
                    >
                        <VisibilityOff />
                    </IconButton>
                    <Typography variant="caption" sx={{ marginLeft: 0.5, color: 'white' }}>Hide</Typography>
                </Box>
            </Box>
        </ThumbnailContainer>
    </ListItemButton>
    );
};

export default TopThreeListItem;
