import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Checkbox,
    Paper,
    TableSortLabel,
} from '@mui/material';
import { DataItem } from "../App";

// Define props type for DataTable
interface DataTableProps {
    data: DataItem[];
    onToggleFlag: (hash: string, columnName: 'played' | 'hide') => void; // Use specific column types
}

// Header column type
interface Column {
    id: keyof DataItem; // Using keyof to ensure type safety
    label: string;
}

// TableHeader component for sorting
const TableHeader: React.FC<{
    columns: Column[];
    order: 'asc' | 'desc';
    orderBy: keyof DataItem; // Make sure this matches keyof DataItem
    onRequestSort: (property: keyof DataItem) => void;
}> = ({ columns, order, orderBy, onRequestSort }) => {
    return (
        <TableHead>
            <TableRow>
                {columns.map((column) => (
                    <TableCell key={column.id}>
                        <TableSortLabel
                            active={orderBy === column.id}
                            direction={orderBy === column.id ? order : 'asc'}
                            onClick={() => onRequestSort(column.id)}
                        >
                            {column.label}
                        </TableSortLabel>
                    </TableCell>
                ))}
            </TableRow>
        </TableHead>
    );
};

const DataTable: React.FC<DataTableProps> = ({ data, onToggleFlag }) => {
    const columns: Column[] = [
        { id: 'name', label: 'Name' },
        { id: 'rating', label: 'Rating' },
        { id: 'played', label: 'Played' },
        { id: 'hide', label: 'Hide' },
        { id: 'review_score', label: 'Review Score' },
        { id: 'game_hash', label: 'Hash' }
    ];

    const [order, setOrder] = React.useState<'asc' | 'desc'>('asc');
    const [orderBy, setOrderBy] = React.useState<keyof DataItem>('name'); // Default sorting column

    const handleRequestSort = (property: keyof DataItem) => {
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
                <TableHeader
                    columns={columns}
                    order={order}
                    orderBy={orderBy}
                    onRequestSort={handleRequestSort}
                />
                <TableBody>
                    {sortedData.map((row) => (
                        <TableRow key={row.game_hash}>
                            {columns.map((column) => (
                                <TableCell key={column.id}>
                                    {column.id === 'played' || column.id === 'hide' ? (
                                        <Checkbox
                                            checked={!!row[column.id as keyof DataItem]} // Ensure to cast to boolean
                                            onChange={() => onToggleFlag(row.game_hash, column.id as 'played' | 'hide')}
                                        />
                                    ) : (
                                        row[column.id as keyof DataItem] // Cast to keyof DataItem
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
