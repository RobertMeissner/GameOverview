import React, {useCallback, useEffect, useState} from 'react';
import axios from 'axios';
import DataTable from './components/DataTable';
import TopThreeListItem from './components/TopThreeListItem';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import {AppBar, Box, Checkbox, Slider, Toolbar, List, ListItemButton, ListItemText, Divider} from '@mui/material';
import {BrowserRouter as Router, Route, Routes, Link} from 'react-router-dom';

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
    const [data, setData] = useState<DataItem[]>([]);
    const [playedFilter, setPlayedFilter] = useState(false);
    const [hideFilter, setHideFilter] = useState(false);
    const [ratingRange, setRatingRange] = useState<number[]>([0.8, 1]);
    const [reviewScoreRange, setReviewScoreRange] = useState<number[]>([7, 9]);
    const [thumbnails, setThumbnails] = useState<{ [key: number]: string }>({});
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const response = await axios.get<DataItem[]>('http://localhost:8000/data/data.parquet');
                if (Array.isArray(response.data)) {
                    setData(response.data);
                    setLoading(false);
                } else {
                    console.error("Expected response to be an array but received:", response.data);
                }
            } catch (error) {
                console.error("Error loading data:", error);
            }
        };

        loadData();

    }, []);

    useEffect(() => {
        if (!loading) {
            const fetchThumbnails = async () => {
                const items = getTopThreeTitles();
                try {
                    const thumbnailPromises = items.map(item =>
                        axios.get<Blob>(`http://localhost:8000/thumbnail/${item.app_id}`, { responseType: 'blob' })
                            .then(response => {
                                const url = URL.createObjectURL(response.data);
                                return { app_id: item.app_id, url };
                            })
                    );
                    const results = await Promise.all(thumbnailPromises);
                    const newThumbnails: { [key: number]: string } = {};
                    results.forEach(result => {
                        newThumbnails[result.app_id] = result.url;
                    });
                    setThumbnails(newThumbnails);
                } catch (error) {
                    console.error("Failed to fetch thumbnails:", error);
                }
            };

            fetchThumbnails();
        }
    }, [loading, data]);

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

    const getTopThreeTitles = () => {
        return data
            .filter(item => !item.hide && !item.played)
            .sort((a, b) => {
                if (b.review_score !== a.review_score) {
                    return b.review_score - a.review_score;
                }
                return b.rating - a.rating;
            })
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
                                    {getTopThreeTitles().map(item => (
                                        <TopThreeListItem
                                            key={item.game_hash}
                                            item={item}
                                            onToggleFlag={handleCheckboxChange}
                                            thumbnailUrl={thumbnails[item.app_id]}
                                        />
                                    ))}
                                </List>
                            </Container>
                        }/>
                    </Routes>
                </Box>
            </Box>
        </Router>
    );
};

export default App;
