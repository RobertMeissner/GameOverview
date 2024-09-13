import React, {useCallback, useEffect, useState} from 'react';
import axios from 'axios';
import DataTable from './components/DataTable';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import {AppBar, Box, Checkbox, Drawer, IconButton, Slider, Toolbar} from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';

// Define the type of your data
export interface DataItem {
    game_hash: string;
    name: string;
    rating: number;
    played: boolean;
    hide: boolean;
    review_score: number

    [key: string]: string | number | boolean;
}

const App: React.FC = () => {
    const [data, setData] = useState<DataItem[]>([]); // Use the DataItem type for the state
    const [playedFilter, setPlayedFilter] = useState(false);
    const [hideFilter, setHideFilter] = useState(false);
    const [ratingRange, setRatingRange] = useState<number[]>([0.8, 1]);
    const [reviewScoreRange, setReviewScoreRange] = useState<number[]>([7, 9]);
    const [drawerOpen, setDrawerOpen] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const response = await axios.get<DataItem[]>('http://localhost:8000/data/data.parquet'); // Specify the response type
                if (Array.isArray(response.data)) {
                    console.log([response.data[0]])
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
        console.log(hash,columnName)
        setData(prevData =>
            prevData.map(item => {
                if (item.game_hash === hash) {
                    return {...item, [columnName]: !item[columnName]}; // Toggle the specific column
                }
                return item; // Return unchanged
            })
        );
        try {
            const index = data.findIndex(item => item.game_hash === hash);
            console.log(hash,columnName, index)
            await axios.post(`http://localhost:8000/data/data.parquet/update`, {
                column: columnName,
                index: index, // Use valid index
                value: !data[index]?.[columnName], // Use optional chaining
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

    const toggleDrawer = (open: boolean) => () => {
        setDrawerOpen(open);
    };

    return (
        <Container>

            <AppBar position="static">
                <Toolbar>
                    <IconButton edge="start" color="inherit" aria-label="menu" onClick={toggleDrawer(true)}>
                        <MenuIcon/>
                    </IconButton>
                    <Typography variant="h6" style={{flexGrow: 1}}>
                        Filtered Data
                    </Typography>
                </Toolbar>
            </AppBar>

            <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
                <div style={{ width: 250, padding: 20 }}>
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
                        step={1}
                    />
                </div>
            </Drawer>

            <DataTable data={filteredData} onToggleFlag={handleCheckboxChange}/>
        </Container>
    );
};

export default App;
