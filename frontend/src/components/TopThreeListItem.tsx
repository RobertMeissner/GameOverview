import React, {useEffect} from 'react';
import {Box, Checkbox, ListItemButton, ListItemText, Typography} from '@mui/material';
import Thumbnail from './Thumbnail';
import {DataItem} from '../App';
import {useThumbnailsContext} from '../context/ThumbnailContext';
import {StoreURL} from "./StoreURL";

interface TopThreeListItemProps {
    item: DataItem;
    onDataChange: (hash: string, columnName: keyof DataItem, value: any) => void;
}

const TopThreeListItem: React.FC<TopThreeListItemProps> = ({ item, onDataChange }) => {
    const { thumbnails, fetchThumbnail } = useThumbnailsContext();

    useEffect(() => {
        fetchThumbnail(item.app_id); // Ensure thumbnail is loaded for the item
    }, [item.app_id, fetchThumbnail]);

    return (
        <ListItemButton key={item.game_hash} sx={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
            <Thumbnail url={thumbnails[item.app_id] || ''} altText={`${item.name} cover`} sizeMultiplier={9}/>

            <Box sx={{flexGrow: 1, display: 'flex', flexDirection: 'column', marginLeft: 2}}>
                <ListItemText
                    primary={item.name}
                    secondary={`Rating: ${item.rating.toPrecision(2)} / Name: ${item.found_game_name}`}
                />
                <Box sx={{display: 'flex', alignItems: 'center', marginTop: 1}}>
                    <Checkbox
                        checked={item.played}
                        onChange={() => onDataChange(item.game_hash, 'played', !item.played)}
                        color="primary"
                    />
                    <Typography variant="caption">Played</Typography>
                    <Checkbox
                        checked={item.hide}
                        onChange={() => onDataChange(item.game_hash, 'hide', !item.hide)}
                        color="primary"
                    />
                    <Typography variant="caption">Hide</Typography>
                </Box>
            </Box>
            <StoreURL appId={item.app_id} store={item.store}/>


        </ListItemButton>
    );
};

export default TopThreeListItem;
