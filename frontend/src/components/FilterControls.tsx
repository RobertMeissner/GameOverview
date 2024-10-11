// src/components/FilterControls.tsx

import React from 'react';
import {Box, Checkbox, Slider, Typography, TextField, FormControlLabel} from '@mui/material';

interface FilterControlsProps {
    playedFilter: boolean;
    setPlayedFilter: (value: boolean | ((prev: boolean) => boolean)) => void;
    hideFilter: boolean;
    setHideFilter: (value: boolean | ((prev: boolean) => boolean)) => void;
    ratingRange: number[];
    setRatingRange: (value: number[]) => void;
    reviewScoreRange: number[];
    setReviewScoreRange: (value: number[]) => void;
    filterZeroIds: boolean; // New prop
    setFilterZeroIds: (value: boolean | ((prev: boolean) => boolean)) => void; // New prop function
    searchQuery: string; // New prop
    setSearchQuery: (value: string) => void; // New prop function
    laterFilter: boolean; // New prop
    setLaterFilter: (value: boolean | ((prev: boolean) => boolean)) => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({
                                                           playedFilter,
                                                           setPlayedFilter,
                                                           hideFilter,
                                                           setHideFilter,
                                                           ratingRange,
                                                           setRatingRange,
                                                           reviewScoreRange,
                                                           setReviewScoreRange,
                                                           filterZeroIds,
                                                           setFilterZeroIds,
                                                           searchQuery,
                                                           setSearchQuery,
                                                           laterFilter,
                                                           setLaterFilter
                                                       }) => {
    return (
        <Box>
            <Typography variant="h6">Filters</Typography>

            <FormControlLabel
                control={<Checkbox
                    checked={playedFilter}
                    onChange={() => setPlayedFilter((prev: boolean) => !prev)}
                />}
                label="Only not played"
            />
            <FormControlLabel
                control={<Checkbox
                    checked={hideFilter}
                    onChange={() => setHideFilter((prev: boolean) => !prev)}
                />}
                label="Hide"
            />
            <FormControlLabel
                control={<Checkbox
                    checked={laterFilter}
                    onChange={() => setLaterFilter((prev: boolean) => !prev)}
                />}
                label="Later"
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

            <Typography>Search by Game Name</Typography>
            <TextField
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
            />

            <Typography>Only IDs == 0</Typography>
            <FormControlLabel
                control={<Checkbox checked={filterZeroIds}
                                   onChange={() => setFilterZeroIds((prev: boolean) => !prev)}/>}
                label="Only Zero IDs"
            />
        </Box>
    );
};

export default FilterControls;
