import React, { useState } from 'react';
import {
    Button,
    Paper,
    TextField,
    Typography,
    FormControlLabel,
    Checkbox,
    Box,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    SelectChangeEvent,
} from '@mui/material';
import axios from 'axios';

const AddDataItem: React.FC<{ onDataAdded: () => void }> = ({ onDataAdded }) => {
    const [formData, setFormData] = useState({
        name: '',
        app_id: '',
        store: 'steam', // Default store
    });

    const [additionalFieldsVisible, setAdditionalFieldsVisible] = useState(false);
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSelectChange = (e: SelectChangeEvent<string>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleAddDataItem = async (): Promise<void> => {
        if (!formData.name && (!formData.app_id || !formData.store)) {
            alert('Please provide either a name or both app_id and store.');
            return;
        }

        const postData = async (data: {
            name: string;
            store: string;
            app_id: number | string; // Accepting string initially for validation
        }): Promise<void> => {
            try {
                const response = await axios.post('http://localhost:8000/games/add', data);
                if (response.status === 200) {
                    const { name, app_id, store, thumbnail_url } = response.data;
                    setFormData({ name, app_id: app_id.toString(), store }); // Convert app_id back to string for handling.
                    setThumbnailUrl(thumbnail_url);
                    setAdditionalFieldsVisible(true);
                    onDataAdded();
                }
            } catch (error) {
                console.error("Error adding data item:", error);
                alert('Failed to add the data item. Please try again.');
            }
        };

        await postData({ ...formData });
    };

    const handleCreateDataItem = async (): Promise<void> => {
        try {
            const response = await axios.post('http://localhost:8000/games/create', formData);
            if (response.status === 200) {
                alert('Data item created successfully!');
            }
        } catch (error) {
            console.error("Error creating data item:", error);
            alert('Failed to create the data item. Please try again.');
        }
    };

    return (
        <Paper elevation={3} sx={{ padding: 3, margin: 3 }}>
            <Typography variant="h4" gutterBottom>
                Add New Data Item
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TextField
                    name="name"
                    label="Name"
                    fullWidth
                    margin="normal"
                    value={formData.name}
                    onChange={handleInputChange}
                />
                {thumbnailUrl && (
                    <Box
                        component="img"
                        alt="Thumbnail"
                        src={thumbnailUrl}
                        sx={{ width: '50%', height: 'auto', marginLeft: 2 }} // Thumbnail fills half the column
                    />
                )}
            </Box>
            <TextField
                name="app_id"
                label="App ID"
                fullWidth
                margin="normal"
                type="number"
                value={formData.app_id}
                onChange={handleInputChange}
            />
            <FormControl fullWidth margin="normal">
                <InputLabel id="store-label">Store</InputLabel>
                <Select
                    labelId="store-label"
                    name="store"
                    value={formData.store}
                    onChange={handleSelectChange}
                >
                    <MenuItem value="steam">Steam</MenuItem>
                    <MenuItem value="gog">GOG</MenuItem>
                </Select>
            </FormControl>
            {additionalFieldsVisible && (
                <>
                    <FormControlLabel
                        control={
                            <Checkbox
                                onChange={handleInputChange}
                                name="played"
                            />
                        }
                        label="Played"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                onChange={handleInputChange}
                                name="hide"
                            />
                        }
                        label="Hide"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                onChange={handleInputChange}
                                name="later"
                            />
                        }
                        label="Later"
                    />
                    <Box sx={{ marginTop: 2, display: 'flex', gap: 2 }}>
                        <Button variant="contained" color="primary" onClick={handleCreateDataItem}>
                            Create
                        </Button>
                        <Button variant="contained" color="primary" onClick={handleAddDataItem}>
                            WIP: Test Data Item
                        </Button>
                    </Box>
                </>
            )}
        </Paper>
    );
};

export default AddDataItem;
