import React, {useState} from 'react';
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

const AddDataItem: React.FC<{ onDataAdded: () => void }> = ({onDataAdded}) => {
    const initialFormData = {
        name: '',
        app_id: '',
        store: 'steam',
        played: false,
        hide: false,
        later: false,
    };

    const [formData, setFormData] = useState(initialFormData);
    const [additionalFieldsVisible, setAdditionalFieldsVisible] = useState(false);
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value, type, checked} = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSelectChange = (e: SelectChangeEvent<string>) => {
        const {name, value} = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const resetForm = () => {
        setFormData(initialFormData);
        setAdditionalFieldsVisible(false);
        setThumbnailUrl(null);
    };

    const handleTestDataItem = async (): Promise<void> => {
        if (!formData.name && (!formData.app_id || !formData.store)) {
            alert('Please provide either a name or both app_id and store.');
            return;
        }

        const postData = async (data: {
            name: string;
            store: string;
            app_id: number | string;
        }): Promise<void> => {
            try {
                const response = await axios.post('/api/games/add', data);
                if (response.status === 200) {
                    const {name, app_id, store, thumbnail_url} = response.data;
                    setFormData({
                        name,
                        app_id: app_id.toString(),
                        store,
                        played: formData.played,
                        hide: formData.hide,
                        later: formData.later
                    }); // Convert app_id back to string for handling.
                    setThumbnailUrl(thumbnail_url);
                    setAdditionalFieldsVisible(true);
                    onDataAdded();
                }
            } catch (error) {
                console.error("Error adding data item:", error);
                alert('Failed to add the data item. Please try again.');
            }
        };

        await postData({...formData});
    };

    const handleCreateDataItem = async (): Promise<void> => {
        const data = {
            name: formData.name,
            store: formData.store,
            app_id: formData.app_id,
            thumbnail_url: thumbnailUrl,
            played: formData.played,
            hide: formData.hide,
            later: formData.later,
        };

        try {
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/games/create`, data);
            if (response.status === 200) {
                alert('Data item created successfully!');
                resetForm(); // Optional: reset the form after creation
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                if (error.response.status === 409) {
                    alert(error.response.data.detail || 'Conflict error occurred.');
                } else {
                    alert('Failed to create the data item. Please try again.');
                }
            } else {
                console.error("Error creating data item:", error);
                alert('An unexpected error occurred. Please try again.');
            }
        }
    };

    return (
        <Paper elevation={3} sx={{padding: 3, margin: 3}}>
            <Typography variant="h4" gutterBottom>
                Add New Data Item
            </Typography>
            <Box sx={{display: 'flex', alignItems: 'center'}}>
                <TextField
                    name="name"
                    label="Name"
                    fullWidth
                    margin="normal"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={additionalFieldsVisible}
                />
                {thumbnailUrl && (
                    <Box
                        component="img"
                        alt="Thumbnail"
                        src={thumbnailUrl}
                        sx={{width: '50%', height: 'auto', marginLeft: 2}} // Thumbnail fills half the column
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
                disabled={additionalFieldsVisible}
            />
            <FormControl fullWidth margin="normal">
                <InputLabel id="store-label">Store</InputLabel>
                <Select
                    labelId="store-label"
                    name="store"
                    value={formData.store}
                    onChange={handleSelectChange}
                    variant="filled"
                    disabled={additionalFieldsVisible}
                >
                    <MenuItem value="steam">Steam</MenuItem>
                    <MenuItem value="gog">GOG</MenuItem>
                </Select>
            </FormControl>
            {!additionalFieldsVisible && (
                <Button variant="contained" color="primary" onClick={handleTestDataItem}>
                    Test Game
                </Button>
            )}
            {additionalFieldsVisible && (
                <>
                    <FormControlLabel
                        control={
                            <Checkbox
                                onChange={handleInputChange}
                                name="played"
                                checked={formData.played}
                            />
                        }
                        label="Played"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                onChange={handleInputChange}
                                name="hide"
                                checked={formData.hide}
                            />
                        }
                        label="Hide"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                onChange={handleInputChange}
                                name="later"
                                checked={formData.later}
                            />
                        }
                        label="Later"
                    />
                    <Box sx={{marginTop: 2, display: 'flex', gap: 2}}>
                        <Button variant="contained" color="primary" onClick={handleTestDataItem}>
                            Test Game
                        </Button>
                        <Button variant="contained" color="primary" onClick={handleCreateDataItem}>
                            Add Game
                        </Button>
                        <Button variant="outlined" color="secondary" onClick={resetForm}>
                            Reset
                        </Button>
                    </Box>
                </>
            )}
        </Paper>
    );
};

export default AddDataItem;
