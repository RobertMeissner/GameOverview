// src/components/FilterControls.tsx

import React from 'react';
import { Box, Checkbox, Slider, Typography } from '@mui/material';

interface FilterControlsProps {
    playedFilter: boolean;
    setPlayedFilter: (value: boolean | ((prev: boolean) => boolean)) => void;
    hideFilter: boolean;
    setHideFilter: (value: boolean | ((prev: boolean) => boolean)) => void;
    ratingRange: number[];
    setRatingRange: (value: number[]) => void;
    reviewScoreRange: number[];
    setReviewScoreRange: (value: number[]) => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({
    playedFilter, setPlayedFilter,
    hideFilter, setHideFilter,
    ratingRange, setRatingRange,
    reviewScoreRange, setReviewScoreRange
}) => {
    return (
        <Box>
            <Typography variant="h6">Filters</Typography>

            <Typography>Filter by Played (Show only not played games)</Typography>
            <Checkbox
                checked={playedFilter}
                onChange={() => setPlayedFilter((prev: boolean) => !prev)}
            />

            <Typography>Filter by Hide</Typography>
            <Checkbox
                checked={hideFilter}
                onChange={() => setHideFilter((prev: boolean) => !prev)}
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
    );
};

export default FilterControls;
