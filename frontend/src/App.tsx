// App.tsx

import React, {useCallback, useEffect, useState} from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { Box, AppBar, Container, Divider, ListItemButton, ListItemText, Toolbar, Typography, List } from '@mui/material';
import useData from './hooks/useData';
import useThumbnails from './hooks/useThumbnails';
import FilterControls from './components/FilterControls';
import DataTable from './components/DataTable';
import TopThreeListItem from './components/TopThreeListItem';
import axios from "axios";

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
    const thumbnails = useThumbnails(topThreeGames, loading);

    const [playedFilter, setPlayedFilter] = useState(false);
    const [hideFilter, setHideFilter] = useState(false);
    const [ratingRange, setRatingRange] = useState<number[]>([0.8, 1]);
    const [reviewScoreRange, setReviewScoreRange] = useState<number[]>([7, 9]);

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
            <Box sx={{ display: 'flex' }}>
                <AppBar position="fixed">
                    <Toolbar>
                        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                            My Application
                        </Typography>
                    </Toolbar>
                </AppBar>

                <Box
                    sx={{
                        width: 240,
                        flexShrink: 0,
                        bgcolor: 'background.paper',
                        height: '100vh',
                        position: 'fixed',
                        paddingTop: 8,
                    }}
                >
                    <List>
                        <ListItemButton component={Link} to="/overview">
                            <ListItemText primary="Overview"/>
                        </ListItemButton>
                        <ListItemButton component={Link} to="/">
                            <ListItemText primary="Top Three"/>
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

                <Box component="main" sx={{ flexGrow: 1, padding: 3 }}>
                    <Toolbar />
                    <Routes>
                        <Route path="/overview" element={
                            <Container sx={{ flexGrow: 1 }}>
                                <DataTable data={filteredData} onToggleFlag={handleCheckboxChange} />
                            </Container>
                        } />
                        <Route path="/" element={
                            <Container sx={{ flexGrow: 1 }}>
                                <Typography variant="h4">Top Three Rated Titles</Typography>
                                <List>
                                    {topThreeGames.map(item => (
                                        <TopThreeListItem
                                            key={item.game_hash}
                                            item={item}
                                            onToggleFlag={handleCheckboxChange}
                                            thumbnailUrl={thumbnails[item.app_id]}
                                        />
                                    ))}
                                </List>
                            </Container>
                        } />
                    </Routes>
                </Box>
            </Box>
        </Router>
    );
};

export default App;
