import React, { useCallback, useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { Box, AppBar, Container, Divider, List, ListItemButton, ListItemText, Toolbar, Typography } from '@mui/material';
import axios from 'axios';
import useData from './hooks/useData';
import FilterControls from './components/FilterControls';
import DataTable from './components/DataTable';
import TopThreeListItem from './components/TopThreeListItem';
import { ThumbnailProvider } from './context/ThumbnailContext';

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
    [key: string]: string | number | boolean;
}

const App: React.FC = () => {
    const [data, loading, setData] = useData();
    const [topThreeGames, setTopThreeGames] = useState<DataItem[]>([]);

    const [playedFilter, setPlayedFilter] = useState(false);
    const [hideFilter, setHideFilter] = useState(false);
    const [ratingRange, setRatingRange] = useState<number[]>([0.8, 1]);
    const [reviewScoreRange, setReviewScoreRange] = useState<number[]>([7, 9]);

    const SIDEBAR_WIDTH = 240;
    const APPBAR_HEIGHT = 64; // Height of AppBar

    const updateTopThreeGames = useCallback(() => {
        const topThree = data
            .filter(item => !item.hide && !item.played)
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

    const handleCheckboxChange = useCallback(async (hash: string, columnName: string) => {
        setData(prevData =>
            prevData.map((item: DataItem) => {
                if (item.game_hash === hash) {
                    return { ...item, [columnName]: !item[columnName] };
                }
                return item;
            })
        );

        try {
            const index = data.findIndex(item => item.game_hash === hash);
            await axios.post(`http://localhost:8000/data/data.parquet/update`, {
                column: columnName,
                index: index,
                value: !data[index]?.[columnName],
            });
            updateTopThreeGames();
        } catch (error) {
            console.error("Error updating column value:", error);
        }
    }, [data, setData, updateTopThreeGames]);

    const filteredData = data.filter(item => {
        const ratingInRange = item.rating >= ratingRange[0] && item.rating <= ratingRange[1];
        const reviewScoreInRange = item.review_score >= reviewScoreRange[0] && item.review_score <= reviewScoreRange[1];
        const playedCriteria = playedFilter ? !item.played : true;
        const hideCriteria = hideFilter ? !item.hide : true;

        return ratingInRange && reviewScoreInRange && playedCriteria && hideCriteria;
    });

    return (
        <Router>
            <ThumbnailProvider>
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
                    <AppBar position="fixed" sx={{ zIndex: 'drawer', height: APPBAR_HEIGHT }}>
                        <Toolbar>
                            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                                My Application
                            </Typography>
                        </Toolbar>
                    </AppBar>
                    <Toolbar /> {/* Add this for AppBar space compensation */}
                    <Box sx={{ display: 'flex', flexDirection: 'row', flexGrow: 1 }}>
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
                                    <ListItemText primary="Overview" />
                                </ListItemButton>
                                <ListItemButton component={Link} to="/">
                                    <ListItemText primary="Top Three" />
                                </ListItemButton>
                            </List>
                            <Divider sx={{ marginY: 1 }} />
                            <FilterControls
                                playedFilter={playedFilter}
                                setPlayedFilter={setPlayedFilter}
                                hideFilter={hideFilter}
                                setHideFilter={setHideFilter}
                                ratingRange={ratingRange}
                                setRatingRange={setRatingRange}
                                reviewScoreRange={reviewScoreRange}
                                setReviewScoreRange={setReviewScoreRange}
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
                                    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                        <Typography variant="h4">Overview</Typography>
                                        <DataTable
                                            data={filteredData}
                                            onToggleFlag={handleCheckboxChange}
                                        />
                                    </Box>
                                } />
                                <Route path="/" element={
                                    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                        <Typography variant="h4">Top Three Rated Titles</Typography>
                                        <List sx={{ flexGrow: 1 }}>
                                            {topThreeGames.map(item => (
                                                <TopThreeListItem
                                                    key={item.game_hash}
                                                    item={item}
                                                    onToggleFlag={handleCheckboxChange}
                                                />
                                            ))}
                                        </List>
                                    </Box>
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
