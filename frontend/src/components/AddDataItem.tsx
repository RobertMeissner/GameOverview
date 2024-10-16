import React, { useState } from 'react';
import { Button, Paper, TextField, Typography, FormControlLabel, Checkbox, Box } from '@mui/material';
import axios from 'axios';

const AddDataItem: React.FC<{ onDataAdded: () => void }> = ({ onDataAdded }) => {
    const [formData, setFormData] = useState({
        name: '',
        app_id: '',
        store: '',
        rating: '',
        review_score: '',
        reviewsRating: '',
        played: false,
        hide: false,
        later: false,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleAddDataItem = async () => {
        // Validation: either `name` or `app_id` and `store` must be set
        if (!formData.name && (!formData.app_id || !formData.store)) {
            alert('Please provide either a name or both app_id and store.');
            return;
        }

        // Call the API to add the new DataItem
        try {
            await axios.post('http://localhost:8000/data/data.parquet/add', { ...formData });
            onDataAdded(); // Refresh the data in the parent component
            setFormData({ // Reset form after submission
                name: '',
                app_id: '',
                store: '',
                rating: '',
                review_score: '',
                reviewsRating: '',
                played: false,
                hide: false,
                later: false,
            });
        } catch (error) {
            console.error("Error adding data item:", error);
            alert('Failed to add the data item. Please try again.');
        }
    };

    return (
        <Paper elevation={3} sx={{ padding: 3, margin: 3 }}>
            <Typography variant="h4" gutterBottom>
                Add New Data Item
            </Typography>
            <TextField
                name="name"
                label="Name"
                fullWidth
                margin="normal"
                value={formData.name}
                onChange={handleChange}
            />
            <TextField
                name="app_id"
                label="App ID"
                fullWidth
                margin="normal"
                value={formData.app_id}
                onChange={handleChange}
            />
            <TextField
                name="store"
                label="Store"
                fullWidth
                margin="normal"
                value={formData.store}
                onChange={handleChange}
            />
            <TextField
                name="rating"
                label="Rating"
                fullWidth
                margin="normal"
                value={formData.rating}
                onChange={handleChange}
            />
            <TextField
                name="review_score"
                label="Review Score"
                fullWidth
                margin="normal"
                value={formData.review_score}
                onChange={handleChange}
            />
            <TextField
                name="reviewsRating"
                label="Reviews Rating"
                fullWidth
                margin="normal"
                value={formData.reviewsRating}
                onChange={handleChange}
            />
            <FormControlLabel
                control={
                    <Checkbox
                        checked={formData.played}
                        onChange={handleChange}
                        name="played"
                    />
                }
                label="Played"
            />
            <FormControlLabel
                control={
                    <Checkbox
                        checked={formData.hide}
                        onChange={handleChange}
                        name="hide"
                    />
                }
                label="Hide"
            />
            <FormControlLabel
                control={
                    <Checkbox
                        checked={formData.later}
                        onChange={handleChange}
                        name="later"
                    />
                }
                label="Later"
            />
            <Box sx={{ marginTop: 2 }}>
                <Button variant="contained" color="primary" onClick={handleAddDataItem}>
                    WIP: Test Data Item
                </Button>
            </Box>
        </Paper>
    );
};

export default AddDataItem;
