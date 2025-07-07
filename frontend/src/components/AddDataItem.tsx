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
    Alert,
} from '@mui/material';
import { GameService } from '../services/gameService';

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
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

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
        setError(null);
    };

    const handleTestDataItem = async (): Promise<void> => {
        if (!formData.name && (!formData.app_id || !formData.store)) {
            setError('Please provide either a name or both app_id and store.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Create a temporary game to test Steam API data
            const testData = {
                name: formData.name,
                store: formData.store as 'steam' | 'gog' | 'epic' | 'other',
                app_id: formData.app_id || undefined,
                status: 'backlog' as const, // Temporary status for testing
            };

            const response = await GameService.addGame(testData);
            
            if (response.success) {
                const game = response.game;
                setFormData({
                    name: game.name || formData.name,
                    app_id: game.app_id?.toString() || formData.app_id,
                    store: game.store || formData.store,
                    played: formData.played,
                    hide: formData.hide,
                    later: formData.later
                });
                setThumbnailUrl(game.thumbnail_url);
                setAdditionalFieldsVisible(true);
                
                // Delete the temporary game since this was just a test
                if (game.id) {
                    try {
                        await GameService.deleteGame(game.id);
                    } catch (deleteError) {
                        console.warn('Failed to delete temporary test game:', deleteError);
                    }
                }
                
                onDataAdded();
            }
        } catch (error: any) {
            console.error("Error testing game data:", error);
            setError(error.message || 'Failed to test the game data. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateDataItem = async (): Promise<void> => {
        setIsLoading(true);
        setError(null);

        const data = {
            name: formData.name,
            store: formData.store as 'steam' | 'gog' | 'epic' | 'other',
            app_id: formData.app_id || undefined,
            status: (formData.played ? 'completed' : (formData.later ? 'wishlist' : 'backlog')) as 'backlog' | 'playing' | 'completed' | 'dropped' | 'wishlist',
            notes: formData.hide ? 'Hidden' : undefined,
            played: formData.played,
            hide: formData.hide,
            later: formData.later,
        };

        try {
            const response = await GameService.addGame(data);
            if (response.success) {
                setError(null);
                resetForm();
                onDataAdded();
                // Show success message
                alert('Game added to your library successfully!');
            }
        } catch (error: any) {
            console.error("Error creating game:", error);
            setError(error.message || 'Failed to add the game. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Paper elevation={3} sx={{padding: 3, margin: 3}}>
            <Typography variant="h4" gutterBottom>
                Add New Game
            </Typography>
            
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}
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
                    <MenuItem value="epic">Epic Games</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                </Select>
            </FormControl>
            {!additionalFieldsVisible && (
                <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleTestDataItem}
                    disabled={isLoading}
                >
                    {isLoading ? 'Testing...' : 'Test Game'}
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
                        <Button 
                            variant="contained" 
                            color="primary" 
                            onClick={handleTestDataItem}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Testing...' : 'Test Game'}
                        </Button>
                        <Button 
                            variant="contained" 
                            color="success" 
                            onClick={handleCreateDataItem}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Adding...' : 'Add Game'}
                        </Button>
                        <Button 
                            variant="outlined" 
                            color="secondary" 
                            onClick={resetForm}
                            disabled={isLoading}
                        >
                            Reset
                        </Button>
                    </Box>
                </>
            )}
        </Paper>
    );
};

export default AddDataItem;
