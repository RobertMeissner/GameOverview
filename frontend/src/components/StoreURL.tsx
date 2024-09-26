import React from "react";
import {Box, Typography} from "@mui/material";

export class StoreURL extends React.Component<{ appId: number, store: string }> {
    render() {
        return <Box sx={{marginLeft: "auto", alignSelf: "center"}}>
            <a
                href={`https://store.steampowered.com/app/${this.props.appId}`}
                target="_blank"
                rel="noopener noreferrer"
            >
                <Typography variant="caption" color="primary">{this.props.store}</Typography>
            </a>
        </Box>;
    }
}
