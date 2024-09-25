import React, { useMemo, useState, useEffect } from 'react';
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
    TablePagination,
    Box
} from '@mui/material';
import Thumbnail from './Thumbnail';
import { DataItem } from '../App';
import { useThumbnailsContext } from '../context/ThumbnailContext';

// Define props type for DataTable
interface DataTableProps {
    data: DataItem[];
    onToggleFlag: (hash: string, columnName: 'played' | 'hide') => void;
}

// Header column type
interface Column {
    id: keyof DataItem | 'thumbnail';
    label: string;
}

// TableHeader component for sorting
const TableHeader: React.FC<{
    columns: Column[];
    order: 'asc' | 'desc';
    orderBy: keyof DataItem | 'thumbnail';
    onRequestSort: (property: keyof DataItem) => void;
}> = ({ columns, order, orderBy, onRequestSort }) => {
    return (
        <TableHead>
            <TableRow>
                {columns.map((column) => (
                    <TableCell key={column.id} sx={{ position: 'sticky', top: 0, backgroundColor: 'background.paper', zIndex: 1 }}>
                        {column.id === 'thumbnail' ? (
                            column.label
                        ) : (
                            <TableSortLabel
                                active={orderBy === column.id}
                                direction={orderBy === column.id ? order : 'asc'}
                                onClick={() => onRequestSort(column.id as keyof DataItem)}
                            >
                                {column.label}
                            </TableSortLabel>
                        )}
                    </TableCell>
                ))}
            </TableRow>
        </TableHead>
    );
};

const DataTable: React.FC<DataTableProps> = ({ data, onToggleFlag }) => {
    const { thumbnails, fetchThumbnail } = useThumbnailsContext();
    const [order, setOrder] = useState<'asc' | 'desc'>('asc');
    const [orderBy, setOrderBy] = useState<keyof DataItem>('name'); // Default sorting column
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const columns: Column[] = [
        { id: 'thumbnail', label: 'Thumbnail' },
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

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const paginatedData = useMemo(() => {
        const start = page * rowsPerPage;
        const end = start + rowsPerPage;
        return sortedData.slice(start, end);
    }, [sortedData, page, rowsPerPage]);

    useEffect(() => {
        paginatedData.forEach(row => {
            fetchThumbnail(row.app_id);
        });
    }, [paginatedData, fetchThumbnail]); // Load thumbnails for paginated data

    return (
        <Paper sx={{ position: 'relative', padding: 2 }}>
            <Box sx={{ position: 'sticky', top: 0, zIndex: 2, backgroundColor: 'background.paper', marginBottom: 2 }}>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={data.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Box>
            <TableContainer sx={{ maxHeight: 1000 }}>
                <Table stickyHeader>
                    <TableHeader
                        columns={columns}
                        order={order}
                        orderBy={orderBy}
                        onRequestSort={handleRequestSort}
                    />
                    <TableBody>
                        {paginatedData.map((row) => (
                            <TableRow key={row.game_hash}>
                                {columns.map((column) => (
                                    <TableCell key={column.id}>
                                        {column.id === 'thumbnail' ? (
                                            <Thumbnail
                                                url={thumbnails[row.app_id] || ''}
                                                altText={`${row.name} cover`}
                                                sizeMultiplier={1.5}
                                            />
                                        ) : column.id === 'played' || column.id === 'hide' ? (
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
        </Paper>
    );
};

export default DataTable;
