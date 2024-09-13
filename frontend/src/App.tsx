import React, {useEffect, useState, useCallback} from 'react';
import axios from 'axios';
import DataTable from './components/DataTable';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import {Drawer, IconButton, Checkbox, Slider, AppBar, Toolbar, Box} from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';

// Define the type of your data
interface DataItem {
    hash: string;
    name: string;
    rating: number;
    played: boolean;
    hide: boolean;
    review_score: number
}

const App: React.FC = () => {
    const [data, setData] = useState<DataItem[]>([]); // Use the DataItem type for the state
    const [playedFilter, setPlayedFilter] = useState(false);
    const [hideFilter, setHideFilter] = useState(false);
    const [ratingRange, setRatingRange] = useState([0.8, 1]);
    const [reviewScoreRange, setReviewScoreRange] = useState([7, 9]);
    const [drawerOpen, setDrawerOpen] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const response = await axios.get<DataItem[]>('http://localhost:8000/data/data.parquet'); // Specify the response type
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

    const handleCheckboxChange = useCallback(async (index: number, columnName: string) => {
        const updatedValue = !data[index][columnName as keyof DataItem];

        console.log(columnName, index)
        try {
            await axios.post(`http://localhost:8000/data/data.parquet/update`, {
                column: columnName,
                index: index,
                value: updatedValue,
            });

            setData((prevData) =>
                prevData.map((item, i) => (i === index ? {...item, [columnName]: updatedValue} : item))
            );
        } catch (error) {
            console.error("Error updating column value:", error);
        }
    }, [data]);

    const filteredData = data.filter(item => {
        const ratingInRange = item.rating >= ratingRange[0] && item.rating <= ratingRange[1];
        const reviewScoreInRange = item.review_score >= reviewScoreRange[0] && item.review_score <= reviewScoreRange[1];
        const playedCriteria = playedFilter ? !item.played : true; // Show all if not filtering
        const hideCriteria = hideFilter ? !item.hide : true; // Inverse logic for hide

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

            <Drawer
                variant="persistent"  // Change to persistent
                anchor="left"
                open={drawerOpen}
                onClose={toggleDrawer(false)
                }>
                <Box sx={{width: 250, padding: 2}}>
                    <Typography variant="h6">Filters</Typography>
                    <Typography>Filter by Played (Show only not-played games)</Typography>
                    <Checkbox
                        checked={playedFilter}
                        onChange={() => setPlayedFilter((prev) => !prev)}
                    />

                    <Typography>Filter by Hide</Typography>
                    <Checkbox
                        checked={hideFilter}
                        onChange={() => setHideFilter((prev) => !prev)}
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
            </Drawer>

            <DataTable data={filteredData} onToggleFlag={handleCheckboxChange}/>
        </Container>
    );
};

export default App;