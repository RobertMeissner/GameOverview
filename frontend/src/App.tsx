import React, {useCallback, useState, useEffect} from 'react';
import {BrowserRouter as Router, Route, Routes, Link} from 'react-router-dom';
import {Box, AppBar, Divider, List, ListItemButton, ListItemText, Toolbar, Typography, styled} from '@mui/material';
import useData from './hooks/useData';
import FilterControls from './components/FilterControls';
import DataTable from './components/DataTable';
import TopThreeListItem from './components/TopThreeListItem';
import {ThumbnailProvider} from './context/ThumbnailContext';
import {AuthProvider} from './context/AuthContext';
import AddDataItem from "./components/AddDataItem";
import ExportData from "./components/ExportData";
import AuthPage from './components/auth/AuthPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import UserMenu from './components/auth/UserMenu';
import { GameService } from './services/gameService';

export interface DataItem {
    id?: number; // Add ID for API operations
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
    metacritic_score: number;

    [key: string]: string | number | boolean | undefined;
}

const TileGrid = styled(Box)`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 0.5rem;
    padding: 0.5rem;
    margin: 0;
`;

// Create a separate component for the authenticated app content
const AuthenticatedApp: React.FC = () => {
    const [data, loading, setData] = useData();
    const [topThreeGames, setTopThreeGames] = useState<DataItem[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>("");

    const [playedFilter, setPlayedFilter] = useState(false);
    const [hideFilter, setHideFilter] = useState(false);
    const [ratingReviewFilter, setRatingReviewFilter] = useState(true); // New filter for ratings and scores
    const [filterZeroIds, setFilterZeroIds] = useState(false);
    const [laterFilter, setLaterFilter] = useState(false);

    //     // const [dialogOpen, setDialogOpen] = useState(false);  // State for managing the dialog
    const SIDEBAR_WIDTH = 240;
    const APPBAR_HEIGHT = 64; // Height of AppBar

    const columnWhitelist = ["thumbnail", 'name', 'rating',"review_score", 'metacritic_score', 'played', 'hide', 'store', "app_id", "corrected_app_id", "found_game_name","reviewsRating", "later"]

    const updateTopThreeGames = useCallback(() => {
        const topThree = data
            .filter(item => !item.hide && !item.played && !item.later)
            .sort((a, b) => {
                if (b.review_score !== a.review_score) {
                    return b.review_score - a.review_score;
                }
                return a.rating - b.rating;
            })
            .slice(0, 3);
        setTopThreeGames(topThree);
    }, [data]);

    useEffect(() => {
        if (!loading) {
            updateTopThreeGames();
        }
    }, [loading, data, updateTopThreeGames]);


    const handleDataAdded = async () => {
        // Refresh the data after a new DataItem is added
        try {
            const games = await GameService.getLegacyGames();
            if (Array.isArray(games)) {
                setData(games);
                updateTopThreeGames();
            }
        } catch (error) {
            console.error("Error refreshing data:", error);
        }
    };

    const handleDataChange = useCallback(async (hash: string, columnName: keyof DataItem, value: any) => {
        // Find the game by hash to get its ID
        const game = data.find(item => item.game_hash === hash);
        if (!game || !game.id) {
            console.error("Game not found or missing ID:", hash);
            return;
        }

        // Optimistically update the UI
        setData(prevData =>
            prevData.map(item => {
                if (item.game_hash === hash) {
                    return {...item, [columnName]: value};
                }
                return item;
            })
        );

        try {
            // Update the backend
            const updateData: any = {};
            updateData[columnName] = value;
            
            await GameService.updateGame(game.id, updateData);
        } catch (error) {
            console.error("Error updating game:", error);
            // Revert the optimistic update on error
            setData(prevData =>
                prevData.map(item => {
                    if (item.game_hash === hash) {
                        return {...item, [columnName]: game[columnName]};
                    }
                    return item;
                })
            );
        }
    }, [data, setData]);

    const filteredData = data.filter(item => {
        const ratingReviewCriteria = ratingReviewFilter ? (item.rating > 0.8 && item.metacritic_score >= 8) : true; // New filter logic for ratings & scores
        const playedCriteria = playedFilter ? !item.played : true;
        const hideCriteria = hideFilter ? !item.hide : true;
        const laterCriteria = laterFilter ? !item.later : true;
        const zeroIdsCriteria = filterZeroIds ? ((item.app_id === 0 && item.corrected_app_id === 0) || (item.found_game_name ? item.name !== item.found_game_name : false)) : true;

        const searchCriteria = searchQuery.length === 0 ? true :
            new RegExp(searchQuery.split('').join('.*'), 'i').test(item.name);

        return ratingReviewCriteria && playedCriteria && hideCriteria && laterCriteria && zeroIdsCriteria && searchCriteria;
    });

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
            <AppBar position="fixed" sx={{zIndex: 'drawer', height: APPBAR_HEIGHT}}>
                <Toolbar>
                    <Typography variant="h6" noWrap component="div" sx={{flexGrow: 1}}>
                        Game Overview
                    </Typography>
                    <UserMenu />
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
                        <ListItemButton component={Link} to="/export">
                            <ListItemText primary="Export" />
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
                        <Route path="/export" element={<ExportData />} />
                    </Routes>
                </Box>
            </Box>
        </Box>
    );
};

const App: React.FC = () => {

    return (
        <Router>
            <AuthProvider>
                <ThumbnailProvider>
                    <Routes>
                        {/* Public routes */}
                        <Route path="/login" element={<AuthPage initialMode="login" />} />
                        <Route path="/register" element={<AuthPage initialMode="register" />} />
                        
                        {/* Protected routes */}
                        <Route path="/*" element={
                            <ProtectedRoute>
                                <AuthenticatedApp />
                            </ProtectedRoute>
                        } />
                    </Routes>
                </ThumbnailProvider>
            </AuthProvider>
        </Router>
    );
};

export default App;
