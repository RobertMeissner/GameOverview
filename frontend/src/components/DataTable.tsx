import React, {useEffect, useMemo, useState} from 'react';
import {
    Box,
    Button,
    Checkbox,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TableSortLabel,
    TextField,
} from '@mui/material';
import Thumbnail from './Thumbnail';
import {DataItem} from '../App';
import {useThumbnailsContext} from '../context/ThumbnailContext';
import {StoreURL} from "./StoreURL";
import TopThreeListItem from './TopThreeListItem';
import {RatingComponent} from "./RatingComponent"; // Import your tile component here

interface DataTableProps {
    data: DataItem[];
    onDataChange: (hash: string, columnName: keyof DataItem, value: any) => void;
    columnWhitelist: (keyof DataItem | 'thumbnail')[];
}

interface Column {
    id: keyof DataItem | 'thumbnail';
    label: string;
}

const TableHeader: React.FC<{
    columns: Column[];
    order: 'asc' | 'desc';
    orderBy: keyof DataItem | 'thumbnail';
    onRequestSort: (property: keyof DataItem) => void;
}> = ({ columns, order, orderBy, onRequestSort }) => (
    <TableHead>
        <TableRow>
            {columns.map((column) => (
                <TableCell key={column.id}
                    sx={{ position: 'sticky', top: 0, backgroundColor: 'background.paper', zIndex: 1 }}>
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

const DataTable: React.FC<DataTableProps> = ({data, onDataChange, columnWhitelist}) => {
    const {thumbnails, fetchThumbnail} = useThumbnailsContext();
    const [order, setOrder] = useState<'asc' | 'desc'>('asc');
    const [orderBy, setOrderBy] = useState<keyof DataItem>('name'); // Default sorting column
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [viewMode, setViewMode] = useState<'table' | 'tiles'>('table'); // State for view mode

    const tilesPerPage = 24
    const columns: Column[] = [
        {id: 'thumbnail', label: 'Thumbnail'},
        {id: 'name', label: 'Name'},
        {id: 'rating', label: 'Rating'},
        {id: 'played', label: 'Played'},
        {id: 'hide', label: 'Hide'},
        {id: 'review_score', label: 'Review Score'},
        {id: 'app_id', label: 'App ID'},
        {id: 'game_hash', label: 'Hash'},
        {id: 'found_game_name', label: 'Found Game Name'},
        {id: 'corrected_app_id', label: 'Corrected App ID'},
        {id: 'store', label: 'Store'},
        {id: 'reviewsRating', label: 'Rating GoG'},
        {id: 'later', label: 'Later'},
    ].filter(column => columnWhitelist.includes(column.id));

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
    }, [paginatedData, fetchThumbnail]);

    const handleCorrectedAppIdChange = (hash: string, value: number) => {
        onDataChange(hash, 'corrected_app_id', value);
    };

    return (
        <Paper sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flexGrow: 1 }}>
            <Box sx={{ position: 'sticky', top: 0, zIndex: 2, backgroundColor: 'background.paper', padding: 1 }}>
                <Button variant="outlined" onClick={() => {
                    setViewMode(viewMode === 'table' ? 'tiles' : 'table')
                    setRowsPerPage(tilesPerPage)
                }}>
                    Switch to {viewMode === 'table' ? 'Tiles' : 'Table'}
                </Button>
                <TablePagination
                    rowsPerPageOptions={viewMode === 'table' ? [5, 10, 25] : [tilesPerPage]}
                    component="div"
                    count={data.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Box>
            <TableContainer sx={{ flexGrow: 1, maxHeight: 1000 }}>
                {viewMode === 'table' ? (
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
                                                    sizeMultiplier={4}
                                                />
                                            ) : column.id === 'played' || column.id === 'hide' || column.id === 'later' ? (
                                                <Checkbox
                                                    checked={!!row[column.id as keyof DataItem]}
                                                    onChange={() => onDataChange(row.game_hash, column.id as 'played' | 'hide' | 'later', !row[column.id as keyof DataItem])}
                                                />
                                            ) : column.id === 'corrected_app_id' ? (
                                                <TextField
                                                    type="number"
                                                    value={row.corrected_app_id}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCorrectedAppIdChange(row.game_hash, parseInt(e.target.value))}
                                                />
                                            ) : column.id === "store" ? (
                                                <StoreURL appId={row.app_id} store={row.store} gogAppUrl={row.storeLink} />
                                            ) : column.id === 'rating' ? (
                                                <RatingComponent row={row}/>
                                            ) : (
                                                row[column.id as keyof DataItem] !== undefined ?
                                                    String(row[column.id as keyof DataItem]) : '-'
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 2 }}>
                        {paginatedData.map((row) => (
                            <TopThreeListItem key={row.game_hash} item={row} onDataChange={onDataChange} />
                        ))}
                    </Box>
                )}
            </TableContainer>
        </Paper>
    );
};

export default DataTable;
