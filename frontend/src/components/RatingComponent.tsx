import React from "react";
import { DataItem } from "../App";
import { Typography, Box } from "@mui/material";
import { Star as StarIcon } from '@mui/icons-material';

interface RatingComponentProps {
    row: DataItem;
    makeWhite?: boolean; // Optionally define makeWhite as a prop
}

export class RatingComponent extends React.Component<RatingComponentProps> {
    render() {
        const { row, makeWhite = false } = this.props; // Default makeWhite to false

        const ratingColor = makeWhite ? "white" : "green";
        const starColor = "yellow";

        return (
            <Box sx={{ display: 'flex', alignItems: 'center', textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)' }}>
                <Typography
                    component="span"
                    sx={{ fontWeight: "bold", color: ratingColor, fontSize:"200%" }}
                >
                    {(row.rating * 100).toFixed(1)}%
                </Typography>
                <Typography
                    component="span"
                    sx={{ fontWeight: "bold", color: ratingColor, fontSize:"200%", marginLeft: 0.5 }}
                >
                    /
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', marginLeft: 0.5 }}>
                    <Typography
                        component="span"
                        sx={{ fontWeight: "bold", color: ratingColor, fontSize:"200%", marginLeft: 0.25 }}
                    >
                        {(row.reviewsRating / 10).toFixed(1)}
                    </Typography>
                    <StarIcon sx={{ color: starColor, fontSize: "175%", verticalAlign: "top" }} />
                </Box>
            </Box>
        );
    }
}
