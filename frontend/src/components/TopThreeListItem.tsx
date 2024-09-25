import React from 'react';
import {ListItemButton, Box, ListItemText, Checkbox, Typography} from '@mui/material';
import Thumbnail from './Thumbnail';
import {DataItem} from '../App';

interface TopThreeListItemProps {
    item: DataItem;
    onToggleFlag: (hash: string, columnName: string) => void;
    thumbnailUrl: string;
}

const TopThreeListItem: React.FC<TopThreeListItemProps> = ({item, onToggleFlag, thumbnailUrl}) => {
    return (
        <ListItemButton key={item.game_hash} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <Thumbnail url={thumbnailUrl} altText={`${item.name} cover`} />

            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', marginLeft: 2 }}>
                <ListItemText
                    primary={item.name}
                    secondary={`Rating: ${item.rating.toPrecision(2)} / Name: ${item.found_game_name}`}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', marginTop: 1 }}>
                    <Checkbox
                        checked={item.played}
                        onChange={() => onToggleFlag(item.game_hash, 'played')}
                        color="primary"
                    />
                    <Typography variant="caption">Played</Typography>
                    <Checkbox
                        checked={item.hide}
                        onChange={() => onToggleFlag(item.game_hash, 'hide')}
                        color="primary"
                    />
                    <Typography variant="caption">Hide</Typography>
                </Box>
                <Box sx={{ marginRight: 'auto', alignSelf: 'center' }}>
                    <a
                        href={`https://store.steampowered.com/app/${item.app_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Typography variant="caption" color="primary">View in Store</Typography>
                    </a>
                </Box>
            </Box>


        </ListItemButton>
    );
};

export default TopThreeListItem;
