import React from "react";
import { Box, Typography, Link } from "@mui/material";

interface StoreURLProps {
  appId: number;
  gogAppUrl: string;
  store: string;
}

export class StoreURL extends React.Component<StoreURLProps> {
  render() {
    const { appId, gogAppUrl, store } = this.props;

    console.log(gogAppUrl, appId, store);
    return (
      <Box sx={{ marginLeft: "auto", alignSelf: "center" }}>
        {appId !== 0 && (
          <Link
            href={`https://store.steampowered.com/app/${appId}`}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ display: "block", mb: 1 }}
          >
            <Typography variant="h6" color="primary">
              {store.toUpperCase()} (Steam)
            </Typography>
          </Link>
        )}
        {gogAppUrl && (
          <Link
            href={gogAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ display: "block", mt: 1 }}
          >
            <Typography variant="h6" color="primary">
              {store.toUpperCase()} (GOG)
            </Typography>
          </Link>
        )}
      </Box>
    );
  }
}
