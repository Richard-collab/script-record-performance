import React from 'react';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Button, Chip } from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import CategoryIcon from '@mui/icons-material/Category';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import type { AnalyticsData, AnalyticsGroup, AnalyticsMetric } from '../types/analytics';

interface MetricTableProps {
    data: AnalyticsData;
}

const MetricRow: React.FC<{ metric: AnalyticsMetric }> = ({ metric }) => {
    const getDiffColor = () => {
        if (metric.diffDirection === 'up') return 'success.main';
        if (metric.diffDirection === 'down') return 'error.main';
        return 'text.secondary';
    };

    const getDiffIcon = () => {
        if (metric.diffDirection === 'up') return <ArrowUpwardIcon fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }} />;
        if (metric.diffDirection === 'down') return <ArrowDownwardIcon fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }} />;
        return null;
    };

    return (
        <TableRow hover>
            <TableCell sx={{ pl: metric.isSubItem ? 4 : 2 }}>
                <Typography variant="body2">{metric.label}</Typography>
            </TableCell>
            <TableCell align="right">
                <Typography variant="body2">{metric.baselineValue}</Typography>
            </TableCell>
            <TableCell align="right">
                <Typography variant="body2">{metric.comparisonValue}</Typography>
            </TableCell>
            <TableCell align="right">
                <Typography
                    variant="body2"
                    sx={{ color: getDiffColor(), fontWeight: metric.diffDirection !== 'neutral' ? 'bold' : 'normal' }}
                >
                    {getDiffIcon()}
                    {metric.diffValue}
                </Typography>
            </TableCell>
        </TableRow>
    );
};

const GroupSection: React.FC<{ group: AnalyticsGroup }> = ({ group }) => {
    const getIcon = () => {
        if (group.icon === 'BarChart') return <BarChartIcon color="primary" sx={{ mr: 1 }} />;
        return <CategoryIcon color="action" sx={{ mr: 1 }} />;
    };

    return (
        <>
            <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                <TableCell colSpan={4} sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getIcon()}
                        <Typography variant="subtitle1" fontWeight="bold">
                            {group.title}
                        </Typography>
                        {group.id === 'core' && (
                            <Button size="small" variant="outlined" sx={{ ml: 'auto' }}>
                                修改外呼数据
                            </Button>
                        )}
                    </Box>
                </TableCell>
            </TableRow>
            {group.metrics.map(metric => (
                <MetricRow key={metric.id} metric={metric} />
            ))}
        </>
    );
};

const MetricTable: React.FC<MetricTableProps> = ({ data }) => {
    return (
        <TableContainer component={Paper} elevation={0} sx={{ flexGrow: 1, overflow: 'auto', p: 3, bgcolor: 'transparent' }}>
             {/* Note: The design has a slightly custom table header inside the first section,
                 but for a dashboard, a global header is often cleaner.
                 I will align with the image which shows headers inside the card logic or top of the table. */}
            <Table stickyHeader>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>指标 (METRIC)</TableCell>
                        <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                            <Box component="span" sx={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', bgcolor: '#9e9e9e', mr: 1 }} />
                            话术 A (基准)
                        </TableCell>
                        <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                             <Box component="span" sx={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', bgcolor: '#2196f3', mr: 1 }} />
                             话术 B (对比)
                        </TableCell>
                        <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>差值 (B-A)</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.groups.map(group => (
                        <GroupSection key={group.id} group={group} />
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default MetricTable;
