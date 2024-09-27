import React from "react";
import { DataItem } from "../App";
import { Typography } from "@mui/material";

interface RatingComponentProps {
    row: DataItem;
    makeWhite?: boolean; // Optionally define makeWhite as a prop
}

export class RatingComponent extends React.Component<RatingComponentProps> {
    render() {
        const { row, makeWhite = false } = this.props; // Default makeWhite to false
        return (
            <Typography
                component="span"
                sx={{ fontWeight: "bold", color: makeWhite ? "white" : "green", fontSize:"200%",
                    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)' }}
            >
                {(row.rating * 100).toFixed(1)}% / {(row.reviewsRating / 10).toFixed(1)}
            </Typography>
        );
    }
}
