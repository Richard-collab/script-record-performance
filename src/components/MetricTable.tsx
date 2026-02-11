import React, { useState } from 'react';
import { Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, IconButton } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Cancel';
import type { AnalyticsData, AnalyticsMetric } from '../types/analytics';

interface MetricTableProps {
    data: AnalyticsData;
    onMetricUpdate?: (
        groupId: string,
        metricId: string,
        field: 'baselineValue' | 'comparisonValue',
        newValue: string
    ) => void;
}

// 可编辑单元格组件
interface EditableCellProps {
    value: string;
    onSave: (newValue: string) => void;
    align?: 'left' | 'center' | 'right';
    sx?: any;
}

const EditableCell: React.FC<EditableCellProps> = ({ value, onSave, align = 'center', sx }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);

    // 提取主值（用于编辑）
    const extractMainValue = (val: string): string => {
        const match = val.match(/^([^[]+)/);
        return (match && match[1]) ? match[1].trim() : val;
    };

    const handleStartEdit = () => {
        // 只编辑主值部分
        const mainValue = extractMainValue(value);
        setEditValue(mainValue);
        setIsEditing(true);
    };

    const handleSave = () => {
        const mainValue = extractMainValue(value);
        if (editValue !== mainValue) {
            // 传递编辑后的主值，让父组件处理衰减率的重新计算
            onSave(editValue);
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditValue(extractMainValue(value));
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    // 解析并显示值（处理 [xx%] 格式）
    const renderValue = (val: string) => {
        const match = val.match(/^(.+?)\s*\[(.+?)\]$/);
        if (match) {
            return (
                <span>
                    {match[1]} <strong>[{match[2]}]</strong>
                </span>
            );
        }
        return val;
    };

    return (
        <TableCell align={align} sx={{ ...sx, position: 'relative' }}>
            {isEditing ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
                    <TextField
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        size="small"
                        autoFocus
                        sx={{ width: 120 }}
                        placeholder="输入主值"
                    />
                    <IconButton size="small" color="primary" onClick={handleSave}>
                        <CheckIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={handleCancel}>
                        <CancelIcon fontSize="small" />
                    </IconButton>
                </Box>
            ) : (
                <Box 
                    sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: 1,
                        cursor: 'pointer',
                        '&:hover .edit-icon': {
                            opacity: 1
                        }
                    }}
                    onDoubleClick={handleStartEdit}
                >
                    <span>{renderValue(value)}</span>
                    <IconButton 
                        className="edit-icon"
                        size="small" 
                        onClick={handleStartEdit}
                        sx={{ 
                            opacity: 0, 
                            transition: 'opacity 0.2s',
                            padding: '2px'
                        }}
                    >
                        <EditIcon sx={{ fontSize: '0.9rem' }} />
                    </IconButton>
                </Box>
            )}
        </TableCell>
    );
};

const MetricTable: React.FC<MetricTableProps> = ({ data, onMetricUpdate }) => {
    // 使用数据中的标题，如果没有则使用默认值
    const baselineTitle = data.baselineTitle || '包名 A';
    const comparisonTitle = data.comparisonTitle || '包名 B';

    const getDiffColor = (direction?: 'up' | 'down' | 'neutral') => {
        if (direction === 'up') return '#4caf50';
        if (direction === 'down') return '#f44336';
        return '#757575';
    };

    return (
        <Box 
            id="metric-table-container"
            data-export-area
            sx={{ 
                p: 3, 
                bgcolor: 'background.default',
            }}
        >
            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e0e0e0', maxHeight:'vh' }}>
                <Table sx={{ minWidth: 800}} stickyHeader aria-label='sticky table'>
                    <TableHead>
                        <TableRow>
                            <TableCell 
                                sx={{ 
                                    fontWeight: 700, 
                                    bgcolor: '#f5f5f5',
                                    borderRight: '1px solid #e0e0e0',
                                    minWidth: 200,
                                    position: 'sticky',
                                    left: 0,
                                    zIndex: 2
                                }}
                            >
                                指标名称
                            </TableCell>
                            <TableCell 
                                align="center" 
                                sx={{ 
                                    fontWeight: 700, 
                                    bgcolor: '#e3f2fd',
                                    borderRight: '1px solid #e0e0e0',
                                    minWidth: 150
                                }}
                            >
                                {baselineTitle} - A
                            </TableCell>
                            <TableCell 
                                align="center" 
                                sx={{ 
                                    fontWeight: 700, 
                                    bgcolor: '#e8f5e9',
                                    borderRight: '1px solid #e0e0e0',
                                    minWidth: 150
                                }}
                            >
                                {comparisonTitle} - B
                            </TableCell>
                            <TableCell 
                                align="center" 
                                sx={{ 
                                    fontWeight: 700, 
                                    bgcolor: '#fff3e0',
                                    minWidth: 150
                                }}
                            >
                                差异 B-A
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.groups.map((group) => (
                            <React.Fragment key={group.id}>
                                {/* 组标题行 */}
                                {group.id !== 'core' && (
                                    <TableRow>
                                        <TableCell 
                                            colSpan={4} 
                                            sx={{ 
                                                bgcolor: '#fafafa', 
                                                fontWeight: 600,
                                                py: 1
                                            }}
                                        >
                                            {group.title}
                                        </TableCell>
                                    </TableRow>
                                )}
                                {/* 指标行 */}
                                {group.metrics.map((metric) => (
                                    <TableRow 
                                        key={metric.id}
                                        sx={{ 
                                            '&:hover': { bgcolor: '#f9f9f9' },
                                            bgcolor: metric.isSubItem ? '#fcfcfc' : 'inherit'
                                        }}
                                    >
                                        <TableCell 
                                            sx={{ 
                                                borderRight: '1px solid #e0e0e0',
                                                pl: metric.isSubItem ? 4 : 2,
                                                position: 'sticky',
                                                left: 0,
                                                bgcolor: 'inherit',
                                                zIndex: 1
                                            }}
                                        >
                                            {metric.label}
                                        </TableCell>
                                        <EditableCell
                                            value={metric.baselineValue}
                                            onSave={(newValue) => {
                                                if (onMetricUpdate) {
                                                    onMetricUpdate(group.id, metric.id, 'baselineValue', newValue);
                                                }
                                            }}
                                            sx={{ borderRight: '1px solid #e0e0e0' }}
                                        />
                                        <EditableCell
                                            value={metric.comparisonValue}
                                            onSave={(newValue) => {
                                                if (onMetricUpdate) {
                                                    onMetricUpdate(group.id, metric.id, 'comparisonValue', newValue);
                                                }
                                            }}
                                            sx={{ borderRight: '1px solid #e0e0e0' }}
                                        />
                                        <TableCell align="center">
                                            <Box 
                                                sx={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center',
                                                    gap: 0.5,
                                                    color: getDiffColor(metric.diffDirection),
                                                    fontWeight: 600
                                                }}
                                            >
                                                {metric.diffDirection === 'up' && <ArrowUpwardIcon sx={{ fontSize: '1rem' }} />}
                                                {metric.diffDirection === 'down' && <ArrowDownwardIcon sx={{ fontSize: '1rem' }} />}
                                                <span>{metric.diffValue || '--'}</span>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default MetricTable;
