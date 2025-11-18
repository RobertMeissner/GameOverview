import React, { useEffect } from 'react';
import { Box, IconButton, ListItemButton, ListItemText, styled, Typography } from '@mui/material';
import { DataItem } from '../App';
import { useThumbnailsContext } from '../context/ThumbnailContext';
import {PlayArrow, VisibilityOff, Link as LinkIcon, Schedule} from "@mui/icons-material"; // Import LinkIcon
import { RatingComponent } from "./RatingComponent";

interface TopThreeListItemProps {
    item: DataItem;
    onDataChange: (hash: string, columnName: keyof DataItem, value: any) => void;
    showTitle?: boolean
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

const TopThreeListItem: React.FC<TopThreeListItemProps> = ({item, onDataChange, showTitle}) => {
    const {thumbnails, fetchThumbnail} = useThumbnailsContext();

    useEffect(() => {
        fetchThumbnail(item.app_id); // Ensure thumbnail is loaded for the item
    }, [item.app_id, fetchThumbnail]);

    const handlePlayedToggle = (event: React.MouseEvent) => {
        event.stopPropagation();
        onDataChange(item.game_hash, 'played', !item.played);
    };

    const handleHideToggle = (event: React.MouseEvent) => {
        event.stopPropagation();
        onDataChange(item.game_hash, 'hide', !item.hide);
    };

    const handleLaterToggle = (event: React.MouseEvent) => {
        event.stopPropagation();
        onDataChange(item.game_hash, 'later', !item.later); // Handle "later" toggle
    };

    return (
        <ListItemButton
            key={item.game_hash}
            component="div" // Changed to "div" for internal click handling
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                textDecoration: 'none',
                width: '100%',
                maxWidth: '400px',
                padding: 0,
                height: 'auto',
                mb: 0,
                boxShadow: 'none',
                border: 'none',
                '&:hover': {
                    backgroundColor: 'transparent',
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
                        justifyContent: 'flex-end',
                        padding: 0.5,
                        background: 'rgba(0, 0, 0, 0.15)',
                        borderRadius: '8px',
                    }}
                >
                    <ListItemText
                        primary={
                            showTitle ? <Typography
                                variant="body1"
                                sx={{
                                    color: 'white',
                                    fontWeight: 'bold',
                                    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)',
                                    mb: 0
                                }}
                            >
                                {item.name}
                            </Typography> : ""
                        }
                        secondary={
                            <RatingComponent row={item} makeWhite={true} />
                        }
                    />
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            marginTop: 0.25,
                            marginRight: 5.25,
                            backgroundColor: 'rgba(255,255,255,0.7)',
                            borderRadius: "4px",
                            padding: "0.1rem",
                            width: "100%",
                            justifyContent: "space-around"
                        }}
                    >
                        <IconButton
                            sx={{ color: item.played ? 'primary.main' : 'black'}}
                            onClick={handlePlayedToggle}
                        >
                            <PlayArrow sx={{fontSize: "1.5rem"}} />
                        </IconButton>
                        <Typography variant="caption" sx={{ marginLeft: 0.5, color: 'black', fontSize: '0.75rem' }}>
                            Played
                        </Typography>
                        <IconButton
                            sx={{ color: item.hide ? 'primary.main' : 'black'}}
                            onClick={handleHideToggle}
                        >
                            <VisibilityOff sx={{fontSize: "1.5rem"}} />
                        </IconButton>
                        <Typography variant="caption" sx={{ marginLeft: 0.5, color: 'black', fontSize: '0.75rem' }}>
                            Hide
                        </Typography>
                        <IconButton
                            sx={{ color: item.later ? 'primary.main' : 'black'}}
                            onClick={handleLaterToggle}
                        >
                            <Schedule sx={{ fontSize: "1.5rem" }} />
                        </IconButton>
                        <Typography variant="caption" sx={{ marginLeft: 0.5, color: 'black', fontSize: '0.75rem' }}>
                            Later
                        </Typography>
                        <IconButton
                            component="a"
                            href={item.storeLink ? item.storeLink : item.app_id ? `https://store.steampowered.com/app/${item.app_id}` : ""}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ marginLeft: 1 }}
                        >
                            <LinkIcon sx={{ color: 'black', fontSize: "1.5rem" }} />
                        </IconButton>
                    </Box>
                </Box>
            </ThumbnailContainer>
        </ListItemButton>
    );
};

export default TopThreeListItem;
