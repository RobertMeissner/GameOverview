// src/components/ExportData.tsx

import React from 'react';
import {Button, Paper} from '@mui/material';
import axios from 'axios';

const ExportData: React.FC = () => {
    const handleExport = async () => {
        try {
            const response = await axios.get('http://localhost:8000/data/export', {
                responseType: 'blob', // Important to specify the response type as blob
            });

            // Create a URL for the CSV file
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'exported_data.csv'); // Change the filename as needed

            // Append to the body to make it work in Firefox
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exporting data:', error);
        }
    };
    const handleExportMarkdown = async () => {
        try {
            const response = await axios.get('http://localhost:8000/data/export_markdown', {
                responseType: 'blob', // Important for file download
            });

            // Create a URL for the Markdown file
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'exported_data.md'); // Set the filename

            // Append to the body to make it work in Firefox
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exporting markdown:', error);
        }
    };

    return (
        <Paper>
            <Button variant="contained" onClick={handleExport}>
                Export Data as CSV
            </Button>
            <Button variant="contained" onClick={handleExportMarkdown}>
                Export Game Names as Markdown
            </Button>
        </Paper>
    )
        ;
};

export default ExportData;
