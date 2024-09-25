import React, { useMemo, useState } from 'react';
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
    onToggleFlag: (hash: string, columnName: 'played' | 'hide') => void;
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
    const [order, setOrder] = useState<'asc' | 'desc'>('asc');
    const [orderBy, setOrderBy] = useState<keyof DataItem>('name'); // Default sorting column

    const columns: Column[] = [
        { id: 'name', label: 'Name' },
        { id: 'rating', label: 'Rating' },
        { id: 'played', label: 'Played' },
        { id: 'hide', label: 'Hide' },
        { id: 'review_score', label: 'Review Score' },
        { id: 'app_id', label: 'App ID' },
        { id: 'game_hash', label: 'Hash' },
        { id: 'found_game_name', label: 'Found Game Name' },
        { id: 'corrected_app_id', label: 'Corrected App ID' },
    ];

    const handleRequestSort = (property: keyof DataItem) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const sortedData = useMemo(() => {
        return [...data].sort((a, b) => {
            if (a[orderBy] < b[orderBy]) {
                return order === 'asc' ? -1 : 1;
            }
            if (a[orderBy] > b[orderBy]) {
                return order === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [data, order, orderBy]);

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
                                        row[column.id as keyof DataItem] !== undefined ? (
                                            String(row[column.id as keyof DataItem]) // Convert to string to handle boolean and number
                                        ) : '-'
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
