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
                <Typography variant="h6" color="primary">{this.props.store.toUpperCase()}</Typography>
            </a>
        </Box>;
    }
}
