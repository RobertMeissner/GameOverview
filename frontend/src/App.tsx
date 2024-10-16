import React, {useCallback, useState, useEffect} from 'react';
import {BrowserRouter as Router, Route, Routes, Link} from 'react-router-dom';
import {Box, AppBar, Divider, List, ListItemButton, ListItemText, Toolbar, Typography, styled} from '@mui/material';
import axios from 'axios';
import useData from './hooks/useData';
import FilterControls from './components/FilterControls';
import DataTable from './components/DataTable';
import TopThreeListItem from './components/TopThreeListItem';
import {ThumbnailProvider} from './context/ThumbnailContext';
import AddDataItem from "./components/AddDataItem";

export interface DataItem {
    game_hash: string;
    name: string;
    rating: number;
    played: boolean;
    hide: boolean;
    review_score: number;
    found_game_name: string;
    corrected_app_id: number;
    app_id: number;
    store: string;
    reviewsRating: number;
    storeLink: string;
    later: boolean;

    [key: string]: string | number | boolean;
}

const TileGrid = styled(Box)`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 0.5rem;
    padding: 0.5rem;
    margin: 0;
`;

const App: React.FC = () => {
    const [data, loading, setData] = useData();
    const [topThreeGames, setTopThreeGames] = useState<DataItem[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>("");

    const [playedFilter, setPlayedFilter] = useState(false);
    const [hideFilter, setHideFilter] = useState(false);
    const [ratingReviewFilter, setRatingReviewFilter] = useState(true); // New filter for ratings and scores
    const [filterZeroIds, setFilterZeroIds] = useState(false);
    const [laterFilter, setLaterFilter] = useState(false);

    const [dialogOpen, setDialogOpen] = useState(false);  // State for managing the dialog
    const SIDEBAR_WIDTH = 240;
    const APPBAR_HEIGHT = 64; // Height of AppBar

    const columnWhitelist = ["thumbnail", 'name', 'rating', 'review_score', 'played', 'hide', 'store', "app_id", "corrected_app_id", "found_game_name","reviewsRating", "later"]

    const updateTopThreeGames = useCallback(() => {
        const topThree = data
            .filter(item => !item.hide && !item.played && !item.later)
            .sort((a, b) => {
                if (b.review_score !== a.review_score) {
                    return b.review_score - a.review_score;
                }
                return b.rating - a.rating;
            })
            .slice(0, 3);
        setTopThreeGames(topThree);
    }, [data]);

    useEffect(() => {
        if (!loading) {
            updateTopThreeGames();
        }
    }, [loading, data, updateTopThreeGames]);


    const handleDataAdded = () => {
        // Refresh or refetch the data after a new DataItem is added
        // e.g., you can call setData or trigger a fetch function
    };

    const handleDataChange = useCallback((hash: string, columnName: keyof DataItem, value: any) => {
        setData(prevData =>
            prevData.map(item => {
                if (item.game_hash === hash) {
                    const updatedItem = {...item, [columnName]: value};

                    // Make an asynchronous call to update the backend
                    axios.post(`http://localhost:8000/data/data.parquet/update`, {
                        column: columnName,
                        index: prevData.findIndex(i => i.game_hash === hash),
                        value: value,
                    }).catch(error => {
                        console.error("Error updating column value:", error);
                        // If there's an error, revert the change in the state
                        setData(currentData =>
                            currentData.map(d => d.game_hash === hash ? item : d)
                        );
                    });

                    return updatedItem;
                }
                return item;
            })
        );
    }, [setData]);

    const filteredData = data.filter(item => {
        const ratingReviewCriteria = ratingReviewFilter ? (item.rating > 0.8 && item.review_score >= 8) : true; // New filter logic for ratings & scores
        const playedCriteria = playedFilter ? !item.played : true;
        const hideCriteria = hideFilter ? !item.hide : true;
        const laterCriteria = laterFilter ? !item.later : true;
        const zeroIdsCriteria = filterZeroIds ? (item.app_id === 0 && item.corrected_app_id === 0 || item.found_game_name ? item.name != item.found_game_name : false) : true;

        const searchCriteria = searchQuery.length === 0 ? true :
            new RegExp(searchQuery.split('').join('.*'), 'i').test(item.name);

        return ratingReviewCriteria && playedCriteria && hideCriteria && laterCriteria && zeroIdsCriteria && searchCriteria;
    });

    return (
        <Router>
            <ThumbnailProvider>
                <Box sx={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
                    <AppBar position="fixed" sx={{zIndex: 'drawer', height: APPBAR_HEIGHT}}>
                        <Toolbar>
                            <Typography variant="h6" noWrap component="div" sx={{flexGrow: 1}}>
                                Game Overview
                            </Typography>
                        </Toolbar>
                    </AppBar>
                    <Toolbar/> {/* Add this for AppBar space compensation */}
                    <Box sx={{display: 'flex', flexDirection: 'row', flexGrow: 1}}>
                        <Box
                            sx={{
                                width: SIDEBAR_WIDTH,
                                flexShrink: 0,
                                bgcolor: 'background.paper',
                                position: 'fixed',
                                top: APPBAR_HEIGHT,
                                bottom: 0, // Ensure it stretches full height
                                overflowY: 'auto', // Enable scrolling
                                paddingTop: 2,
                            }}
                        >
                            <List>
                                <ListItemButton component={Link} to="/overview">
                                    <ListItemText primary="Overview"/>
                                </ListItemButton>
                                <ListItemButton component={Link} to="/">
                                    <ListItemText primary="Top Three"/>
                                </ListItemButton>
                                <ListItemButton component={Link} to="/addDataItem">
                                    <ListItemText primary="Add new game"/>
                                </ListItemButton>
                            </List>
                            <Divider sx={{marginY: 1}}/>
                            <FilterControls
                                playedFilter={playedFilter}
                                setPlayedFilter={setPlayedFilter}
                                hideFilter={hideFilter}
                                setHideFilter={setHideFilter}
                                filterZeroIds={filterZeroIds}
                                setFilterZeroIds={setFilterZeroIds}
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                laterFilter={laterFilter}
                                setLaterFilter={setLaterFilter}
                                ratingReviewFilter={ratingReviewFilter}
                                setRatingReviewFilter={setRatingReviewFilter}
                            />
                        </Box>
                        <Box
                            sx={{
                                flexGrow: 1,
                                marginLeft: `${SIDEBAR_WIDTH}px`,
                                padding: 3,
                                display: 'flex',
                                flexDirection: 'column',
                                overflowY: 'auto', // Enable scrolling for main content
                            }}
                        >
                            <Routes>
                                <Route path="/overview" element={
                                    <Box sx={{flexGrow: 1, display: 'flex', flexDirection: 'column'}}>
                                        <Typography variant="h4">Overview</Typography>
                                        <DataTable
                                            data={filteredData}
                                            onDataChange={handleDataChange}
                                            columnWhitelist={columnWhitelist}
                                        />
                                    </Box>
                                }/>
                                <Route path="/" element={
                                    <Box sx={{flexGrow: 1, display: 'flex', flexDirection: 'column'}}>
                                        <Typography variant="h4">Top Three Rated Titles</Typography>
                                        <TileGrid sx={{flexGrow: 1}}>
                                            {topThreeGames.map(item => (
                                                <TopThreeListItem
                                                    key={item.game_hash}
                                                    item={item}
                                                    onDataChange={handleDataChange}
                                                    showTitle={false}
                                                />
                                            ))}
                                        </TileGrid>
                                    </Box>
                                } />
                                <Route path="/addDataItem" element={
                                    <AddDataItem onDataAdded={handleDataAdded} />
                                } />
                            </Routes>
                        </Box>
                    </Box>
                </Box>
            </ThumbnailProvider>
        </Router>
    );
};

export default App;
