import React, { useState } from 'react';
import {
    Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
    IconButton
} from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import CategoryIcon from '@mui/icons-material/Category';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import type { AnalyticsData, AnalyticsGroup, AnalyticsMetric } from '../types/analytics';

interface MetricTableProps {
    data: AnalyticsData;
    onDataUpdate?: (newData: AnalyticsData) => void;
}

// Helper to calculate diff
const calculateDiff = (base: string, comp: string) => {
    const parse = (s: string) => parseFloat(s.replace(/,/g, '').replace(/%/g, '').replace(/s/g, ''));
    const b = parse(base);
    const c = parse(comp);

    if (isNaN(b) || isNaN(c)) return { value: '--', direction: 'neutral' as const };

    const diff = c - b;
    const direction = diff > 0 ? 'up' as const : diff < 0 ? 'down' as const : 'neutral' as const;
    const absDiff = Math.abs(diff);

    // Determine format based on input (simple heuristic)
    let formattedDiff = absDiff.toString();
    if (base.includes('%') || comp.includes('%')) formattedDiff = `${absDiff.toFixed(2)}%`;
    else if (base.includes('s') || comp.includes('s')) formattedDiff = `${absDiff.toFixed(2)}s`;
    else formattedDiff = Math.floor(absDiff).toLocaleString();

    return { value: formattedDiff, direction };
};

const MetricTable: React.FC<MetricTableProps> = ({ data, onDataUpdate }) => {
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
    const [editData, setEditData] = useState<AnalyticsData | null>(null);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [activeGroupForAdd, setActiveGroupForAdd] = useState<string | null>(null);

    // Add Row State
    const [newRowName, setNewRowName] = useState('');
    const [newRowBase, setNewRowBase] = useState('');
    const [newRowComp, setNewRowComp] = useState('');

    const handleStartEdit = (groupId: string) => {
        setEditingGroupId(groupId);
        setEditData(JSON.parse(JSON.stringify(data))); // Deep copy
    };

    const handleCancelEdit = () => {
        setEditingGroupId(null);
        setEditData(null);
    };

    const handleSaveEdit = () => {
        if (editData && onDataUpdate) {
            onDataUpdate(editData);
        }
        setEditingGroupId(null);
        setEditData(null);
    };

    const handleMetricChange = (groupId: string, metricId: string, field: 'label' | 'baselineValue' | 'comparisonValue', value: string) => {
        if (!editData) return;

        const newEditData = { ...editData };
        const group = newEditData.groups.find(g => g.id === groupId);
        if (!group) return;

        const metric = group.metrics.find(m => m.id === metricId);
        if (!metric) return;

        (metric as any)[field] = value;

        // Recalculate diff if values changed
        if (field === 'baselineValue' || field === 'comparisonValue') {
            const { value: dVal, direction } = calculateDiff(metric.baselineValue, metric.comparisonValue);
            metric.diffValue = dVal;
            metric.diffDirection = direction;
        }

        setEditData(newEditData);
    };

    const handleDeleteMetric = (groupId: string, metricId: string) => {
        if (!editData) return;
        const newEditData = { ...editData };
        const group = newEditData.groups.find(g => g.id === groupId);
        if (group) {
            group.metrics = group.metrics.filter(m => m.id !== metricId);
            setEditData(newEditData);
        }
    };

    const handleOpenAddDialog = (groupId: string) => {
        setActiveGroupForAdd(groupId);
        setNewRowName('');
        setNewRowBase('');
        setNewRowComp('');
        setAddDialogOpen(true);
    };

    const handleAddRow = () => {
        if (!activeGroupForAdd || !onDataUpdate) return;

        // Use current data if not editing, or editData if editing
        const currentData = editingGroupId ? editData : data;
        if (!currentData) return;

        const newData = JSON.parse(JSON.stringify(currentData));
        const group = newData.groups.find((g: AnalyticsGroup) => g.id === activeGroupForAdd);

        if (group) {
            const { value: diffVal, direction } = calculateDiff(newRowBase, newRowComp);
            const newMetric: AnalyticsMetric = {
                id: `custom_${Date.now()}`,
                label: newRowName,
                baselineValue: newRowBase,
                comparisonValue: newRowComp,
                diffValue: diffVal,
                diffDirection: direction,
                isSubItem: false
            };
            group.metrics.push(newMetric);

            if (editingGroupId) {
                setEditData(newData);
            } else {
                onDataUpdate(newData);
            }
        }

        setAddDialogOpen(false);
    };

    const renderMetricRow = (metric: AnalyticsMetric, groupId: string, isEditing: boolean) => {
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

        if (isEditing) {
            return (
                <TableRow key={metric.id}>
                    <TableCell>
                        <TextField
                            size="small"
                            value={metric.label}
                            onChange={(e) => handleMetricChange(groupId, metric.id, 'label', e.target.value)}
                            fullWidth
                        />
                    </TableCell>
                    <TableCell align="right">
                        <TextField
                            size="small"
                            value={metric.baselineValue}
                            onChange={(e) => handleMetricChange(groupId, metric.id, 'baselineValue', e.target.value)}
                            fullWidth
                            inputProps={{ style: { textAlign: 'right' } }}
                        />
                    </TableCell>
                    <TableCell align="right">
                        <TextField
                            size="small"
                            value={metric.comparisonValue}
                            onChange={(e) => handleMetricChange(groupId, metric.id, 'comparisonValue', e.target.value)}
                            fullWidth
                            inputProps={{ style: { textAlign: 'right' } }}
                        />
                    </TableCell>
                    <TableCell align="right">
                        <Typography variant="body2" sx={{ color: getDiffColor() }}>
                             {getDiffIcon()} {metric.diffValue}
                        </Typography>
                    </TableCell>
                     <TableCell padding="checkbox">
                        <IconButton size="small" color="error" onClick={() => handleDeleteMetric(groupId, metric.id)}>
                            <DeleteIcon />
                        </IconButton>
                    </TableCell>
                </TableRow>
            );
        }

        return (
            <TableRow key={metric.id} hover>
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
                {/* Placeholder cell to align with edit mode */}
                {editingGroupId === groupId && <TableCell />}
            </TableRow>
        );
    };

    const renderGroup = (group: AnalyticsGroup) => {
        const isEditing = editingGroupId === group.id;
        const displayGroup = isEditing && editData ? editData.groups.find(g => g.id === group.id) || group : group;

        const getIcon = () => {
            if (group.icon === 'BarChart') return <BarChartIcon color="primary" sx={{ mr: 1 }} />;
            return <CategoryIcon color="action" sx={{ mr: 1 }} />;
        };

        return (
            <React.Fragment key={group.id}>
                <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                    <TableCell colSpan={isEditing ? 5 : 4} sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getIcon()}
                            <Typography variant="subtitle1" fontWeight="bold">
                                {group.title}
                            </Typography>
                            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                                {isEditing ? (
                                    <>
                                        <Button size="small" variant="contained" color="success" startIcon={<CheckIcon />} onClick={handleSaveEdit}>
                                            保存
                                        </Button>
                                        <Button size="small" variant="outlined" color="inherit" startIcon={<CloseIcon />} onClick={handleCancelEdit}>
                                            取消
                                        </Button>
                                        <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => handleOpenAddDialog(group.id)}>
                                            添加行
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        {/* Only show "Modify Outbound Data" button for Core group as per requirement, but generalize it */}
                                        {group.id === 'core' && (
                                            <Button size="small" variant="outlined" onClick={() => handleStartEdit(group.id)}>
                                                修改外呼数据
                                            </Button>
                                        )}
                                        {/* Also allow adding rows directly? Or only in edit mode?
                                            User requirement: "Add new row". Let's put a small + button always available or only in edit mode.
                                            Since "Modify" is explicit for Core, maybe other groups aren't editable by default?
                                            But requirement implies generic "complete function".
                                            I'll add a generic Edit button for other groups too if needed, but for now stick to Core + Add Row ability.
                                            Actually, let's allow adding rows to any group via a small IconButton or similar if not editing.
                                        */}
                                        <Button size="small" variant="text" startIcon={<AddIcon />} onClick={() => handleOpenAddDialog(group.id)}>
                                            添加行
                                        </Button>
                                    </>
                                )}
                            </Box>
                        </Box>
                    </TableCell>
                </TableRow>
                {displayGroup.metrics.map(metric => renderMetricRow(metric, group.id, isEditing))}
            </React.Fragment>
        );
    };

    const currentData = editingGroupId && editData ? editData : data;

    return (
        <>
            <TableContainer component={Paper} elevation={0} sx={{ flexGrow: 1, overflow: 'auto', p: 3, bgcolor: 'transparent' }}>
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
                            {editingGroupId && <TableCell sx={{ width: 50 }} />}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.groups.map(group => renderGroup(group))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
                <DialogTitle>添加新指标行</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: 300 }}>
                        <TextField
                            label="指标名称"
                            value={newRowName}
                            onChange={(e) => setNewRowName(e.target.value)}
                            fullWidth
                            size="small"
                        />
                        <TextField
                            label="基准值 (A)"
                            value={newRowBase}
                            onChange={(e) => setNewRowBase(e.target.value)}
                            fullWidth
                            size="small"
                            helperText="例如: 100, 50%"
                        />
                        <TextField
                            label="对比值 (B)"
                            value={newRowComp}
                            onChange={(e) => setNewRowComp(e.target.value)}
                            fullWidth
                            size="small"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddDialogOpen(false)}>取消</Button>
                    <Button onClick={handleAddRow} variant="contained" disabled={!newRowName || !newRowBase || !newRowComp}>
                        添加
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default MetricTable;
