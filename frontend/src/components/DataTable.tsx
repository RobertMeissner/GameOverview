import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Checkbox,
  Paper
} from '@mui/material';

// Define props type for DataTable
interface DataTableProps {
  data: any[]; // Update this to a structured type if further details available
  onToggleFlag: (index: number, columnName: string) => void;
}

const DataTable: React.FC<DataTableProps> = ({ data, onToggleFlag }) => {
    const columns = [
        { id: 'name', label: 'Name' },
        { id: 'rating', label: 'Rating' },
        { id: 'played', label: 'Played' },
        { id: 'hide', label: 'Hide' },
        { id: 'review_score', label: 'Review Score' }
    ];

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        {columns.map((column) => (
                            <TableCell key={column.id}>
                                <TableSortLabel>{column.label}</TableSortLabel>
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.map((row, index) => (
                        <TableRow key={index}>
                            {columns.map((column) => (
                                <TableCell key={column.id}>
                                    {column.id === 'played' ? (
                                        <Checkbox
                                            checked={row[column.id]}
                                            onChange={() => onToggleFlag(index, 'played')}
                                        />
                                    ) : column.id === 'hide' ? (
                                        <Checkbox
                                            checked={row[column.id]}
                                            onChange={() => onToggleFlag(index, 'hide')}
                                        />
                                    ) : (
                                        row[column.id]
                                    )}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default DataTable;