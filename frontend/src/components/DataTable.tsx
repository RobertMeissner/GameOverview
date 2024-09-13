import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Paper
} from '@mui/material';
import {DataItem} from "../App";



// Define props type for DataTable
interface DataTableProps {
    data: DataItem[]; // ensure to use the specific type
    onToggleFlag: (hash: string, columnName: string) => void; // Update the prop type
}

const DataTable: React.FC<DataTableProps> = ({ data, onToggleFlag }) => {
    const columns = [
        { id: 'name', label: 'Name' },
        { id: 'rating', label: 'Rating' },
        { id: 'played', label: 'Played' },
        { id: 'hide', label: 'Hide' },
        { id: 'review_score', label: 'Review Score' },
        { id: 'game_hash', label: 'hash' }
    ];

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        {columns.map((column) => (
                            <TableCell key={column.id}>{column.label}</TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.map((row) => (
                        <TableRow key={row.game_hash}> {/* Use hash for key */}
                            {columns.map((column) => (
                                <TableCell key={column.id}>
                                    {column.id === 'played' ? (
                                        <Checkbox
                                            checked={row[column.id]}
                                            onChange={() => onToggleFlag(row.game_hash, 'played')}
                                        />
                                    ) : column.id === 'hide' ? (
                                        <Checkbox
                                            checked={row[column.id]}
                                            onChange={() => onToggleFlag(row.game_hash, 'hide')}
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
