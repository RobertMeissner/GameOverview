import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import DataTable from './components/DataTable';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { AppBar, Box, Checkbox, Slider, Toolbar, List, ListItemButton, ListItemText } from '@mui/material';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';

// Define the type of your data
export interface DataItem {
    game_hash: string;
    name: string;
    rating: number;
    played: boolean;
    hide: boolean;
    review_score: number;
    [key: string]: string | number | boolean;
}

const App: React.FC = () => {
    const [data, setData] = useState<DataItem[]>([]);
    const [playedFilter, setPlayedFilter] = useState(false);
    const [hideFilter, setHideFilter] = useState(false);
    const [ratingRange, setRatingRange] = useState<number[]>([0.8, 1]);
    const [reviewScoreRange, setReviewScoreRange] = useState<number[]>([7, 9]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const response = await axios.get<DataItem[]>('http://localhost:8000/data/data.parquet');
                if (Array.isArray(response.data)) {
                    setData(response.data);
                } else {
                    console.error("Expected response to be an array but received:", response.data);
                }
            } catch (error) {
                console.error("Error loading data:", error);
            }
        };

        loadData();
    }, []);

    const handleCheckboxChange = useCallback(async (hash: string, columnName: string) => {
        setData(prevData =>
            prevData.map(item => {
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
        } catch (error) {
            console.error("Error updating column value:", error);
        }
    }, [data]);

    const filteredData = data.filter(item => {
        const ratingInRange = item.rating >= ratingRange[0] && item.rating <= ratingRange[1];
        const reviewScoreInRange = item.review_score >= reviewScoreRange[0] && item.review_score <= reviewScoreRange[1];
        const playedCriteria = playedFilter ? !item.played : true;
        const hideCriteria = hideFilter ? !item.hide : true;

        return ratingInRange && reviewScoreInRange && playedCriteria && hideCriteria;
    });

    // Get Top Three rated titles
    const getTopThreeTitles = () => {
        return data
            .filter(item => !item.hide && !item.played)
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 3);
    };

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

                {/* Fixed Sidebar */}
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
                        <ListItemButton component={Link} to="/">
                            <ListItemText primary="Overview" />
                        </ListItemButton>
                        <ListItemButton component={Link} to="/top-three">
                            <ListItemText primary="Top Three" />
                        </ListItemButton>
                    </List>

                    <Typography variant="h6">Filters</Typography>

                    <Typography>Filter by Played (Show only not played games)</Typography>
                    <Checkbox
                        checked={playedFilter}
                        onChange={() => setPlayedFilter(prev => !prev)}
                    />

                    <Typography>Filter by Hide</Typography>
                    <Checkbox
                        checked={hideFilter}
                        onChange={() => setHideFilter(prev => !prev)}
                    />

                    <Typography>Filter by Rating</Typography>
                    <Slider
                        value={ratingRange}
                        onChange={(event, newValue) => setRatingRange(newValue as number[])}
                        valueLabelDisplay="auto"
                        min={0}
                        max={1}
                        step={0.01}
                    />

                    <Typography>Filter by Review Score</Typography>
                    <Slider
                        value={reviewScoreRange}
                        onChange={(event, newValue) => setReviewScoreRange(newValue as number[])}
                        valueLabelDisplay="auto"
                        min={0}
                        max={10}
                        step={0.5}
                    />
                </Box>

                <Box component="main" sx={{ flexGrow: 1, padding: 3 }}>
                    <Toolbar /> {/* Empty toolbar to compensate for AppBar */}
                    <Routes>
                        <Route path="/" element={
                            <Container sx={{ flexGrow: 1 }}>
                                <DataTable data={filteredData} onToggleFlag={handleCheckboxChange} />
                            </Container>
                        } />
                        <Route path="/top-three" element={
                            <Container sx={{ flexGrow: 1 }}>
                                <Typography variant="h4">Top Three Rated Titles</Typography>
                                <List>
                                    {getTopThreeTitles().map(item => (
                                        <ListItemButton key={item.game_hash}>
                                            <ListItemText primary={item.name} secondary={`Rating: ${item.rating}`} />
                                        </ListItemButton>
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
