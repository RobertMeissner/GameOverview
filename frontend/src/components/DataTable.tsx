import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Checkbox,
    Paper, TableSortLabel
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


    const [order, setOrder] = React.useState<'asc' | 'desc'>('asc');
    const [orderBy, setOrderBy] = React.useState<string>('name'); // Default sorting column

    const handleRequestSort = (property: string) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const sortedData = [...data].sort((a, b) => {
        if (a[orderBy] < b[orderBy]) {
            return order === 'asc' ? -1 : 1;
        }
        if (a[orderBy] > b[orderBy]) {
            return order === 'asc' ? 1 : -1;
        }
        return 0;
    });

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        {columns.map((column) => (
                            <TableCell key={column.id}>
                                <TableSortLabel
                                    active={orderBy === column.id}
                                    direction={orderBy === column.id ? order : 'asc'}
                                    onClick={() => handleRequestSort(column.id)}
                                >
                                    {column.label}
                                </TableSortLabel>
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {sortedData.map((row) => (
                        <TableRow key={row.game_hash}> {/* Use hash for key */}
                            {columns.map((column) => (
                                <TableCell key={column.id}>
                                    {column.id === 'played' || column.id === 'hide' ? (
                                        <Checkbox
                                            checked={row[column.id]}
                                            onChange={() => onToggleFlag(row.game_hash, column.id)}
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
