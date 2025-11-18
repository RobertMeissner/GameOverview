// src/components/FilterControls.tsx

import React from 'react';
import {Box, Checkbox, Typography, TextField, FormControlLabel} from '@mui/material';

interface FilterControlsProps {
    playedFilter: boolean;
    setPlayedFilter: (value: boolean | ((prev: boolean) => boolean)) => void;
    hideFilter: boolean;
    setHideFilter: (value: boolean | ((prev: boolean) => boolean)) => void;
    ratingReviewFilter: boolean;
    setRatingReviewFilter: (value: boolean | ((prev: boolean) => boolean)) => void;
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
                                                           filterZeroIds,
                                                           setFilterZeroIds,
                                                           searchQuery,
                                                           setSearchQuery,
                                                           laterFilter,
                                                           setLaterFilter,
                                                           ratingReviewFilter,
                                                           setRatingReviewFilter
                                                       }) => {
    return (
        <Box>
            <Typography>Search by Game Name</Typography>
            <TextField
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
            />
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
            <FormControlLabel
                control={<Checkbox
                    checked={ratingReviewFilter}
                    onChange={() => setRatingReviewFilter((prev: boolean) => !prev)}
                />}
                label="Only best Rating"
            />

            <FormControlLabel
                control={<Checkbox checked={filterZeroIds}
                                   onChange={() => setFilterZeroIds((prev: boolean) => !prev)}/>}
                label="Unidentified games"
            />
        </Box>
    );
};

export default FilterControls;
