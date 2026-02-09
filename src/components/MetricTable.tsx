import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import type { AnalyticsData, AnalyticsMetric } from '../types/analytics';

interface MetricTableProps {
    data: AnalyticsData;
}

interface MetricCardProps {
    title: string;
    data: AnalyticsData;
    side: 'baseline' | 'comparison';
    showDiff?: boolean;
}

// 单个指标行组件
const MetricRow: React.FC<{ 
    label: string; 
    value: string; 
    diffValue?: string;
    diffDirection?: 'up' | 'down' | 'neutral';
    showDiff?: boolean;
}> = ({ label, value, diffValue, diffDirection, showDiff }) => {
    const getDiffColor = () => {
        if (diffDirection === 'up') return '#4caf50';
        if (diffDirection === 'down') return '#f44336';
        return '#757575';
    };

    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, borderBottom: '1px solid #f0f0f0' }}>
            <Typography variant="body2" sx={{ color: 'text.primary' }} title={label}>
                {label}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {value}
                </Typography>
                {showDiff && diffValue && diffValue !== '--' && (
                    <Typography 
                        variant="caption" 
                        sx={{ 
                            color: getDiffColor(),
                            fontWeight: 600,
                            minWidth: 70,
                            textAlign: 'right',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.3
                        }}
                    >
                        {diffDirection === 'up' && <ArrowUpwardIcon sx={{ fontSize: '0.875rem' }} />}
                        {diffDirection === 'down' && <ArrowDownwardIcon sx={{ fontSize: '0.875rem' }} />}
                        【{diffValue}】
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

// 详情列表组件（用于语料命中率等）
const DetailList: React.FC<{ 
    metrics: AnalyticsMetric[]; 
    side: 'baseline' | 'comparison';
    showDiff?: boolean;
}> = ({ metrics, side, showDiff }) => {
    return (
        <Box sx={{ pl: 2 }}>
            {metrics.map((metric) => (
                <Box 
                    key={metric.id}
                    sx={{ 
                        py: 0.5,
                        display: 'flex'
                    }}
                >
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            color: 'text.secondary',
                            fontSize: '0.875rem',
                            width: '200px',
                            flexShrink: 0
                        }}
                        title={metric.label}
                    >
                        {metric.label}:
                    </Typography>
                    <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                color: 'text.primary',
                                fontSize: '0.875rem',
                                fontWeight: 500
                            }}
                        >
                            {side === 'baseline' ? metric.baselineValue : metric.comparisonValue}
                        </Typography>
                    </Box>
                </Box>
            ))}
        </Box>
    );
};

// 单个卡片组件
const MetricCard: React.FC<MetricCardProps> = ({ title, data, side, showDiff = false }) => {
    const coreGroup = data.groups.find(g => g.id === 'core');
    const otherGroups = data.groups.filter(g => g.id !== 'core');

    const getValue = (metric: AnalyticsMetric) => 
        side === 'baseline' ? metric.baselineValue : metric.comparisonValue;

    return (
        <Paper elevation={0} sx={{ p: 3, height: 'fit-content', border: '1px solid #e0e0e0', overflowY: 'auto' }}>
            {/* 标题 */}
            <Box sx={{ 
                bgcolor: '#000000', 
                color: 'white', 
                py: 1.5, 
                px: 2, 
                mb: 3,
                mx: -3,
                mt: -3
            }}>
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, wordBreak: 'break-word' }} title={title}>
                    {title}
                </Typography>
            </Box>

            {/* 核心指标 */}
            {coreGroup && (
                <Box sx={{ mb: 3 }}>
                    {coreGroup.metrics.map(metric => (
                        <MetricRow 
                            key={metric.id}
                            label={metric.label}
                            value={getValue(metric)}
                            diffValue={metric.diffValue}
                            diffDirection={metric.diffDirection}
                            showDiff={showDiff}
                        />
                    ))}
                </Box>
            )}

            {/* 详情数据 */}
            {otherGroups.map(group => (
                <Box key={group.id} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }} title={group.title}>
                        {group.title}
                    </Typography>
                    <DetailList metrics={group.metrics} side={side} showDiff={showDiff} />
                </Box>
            ))}
        </Paper>
    );
};

// 差异值卡片组件
const DiffCard: React.FC<{ data: AnalyticsData }> = ({ data }) => {
    const coreGroup = data.groups.find(g => g.id === 'core');
    const otherGroups = data.groups.filter(g => g.id !== 'core');

    const getDiffColor = (direction?: 'up' | 'down' | 'neutral') => {
        if (direction === 'up') return '#4caf50';
        if (direction === 'down') return '#f44336';
        return '#757575';
    };

    return (
        <Paper elevation={0} sx={{ p: 3, height: 'fit-content', border: '1px solid #e0e0e0', overflowY: 'auto' }}>
            {/* 标题 */}
            <Box sx={{ 
                bgcolor: '#ff9800', 
                color: 'white', 
                py: 1.5, 
                px: 2, 
                mb: 3,
                mx: -3,
                mt: -3
            }}>
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                    差异值 (B - A)
                </Typography>
            </Box>

            {/* 核心指标差异 */}
            {coreGroup && (
                <Box sx={{ mb: 3 }}>
                    {coreGroup.metrics.map(metric => (
                        <Box key={metric.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, borderBottom: '1px solid #f0f0f0' }}>
                            <Typography variant="body2" sx={{ color: 'text.primary' }} title={metric.label}>
                                {metric.label}
                            </Typography>
                            <Typography 
                                variant="body2" 
                                sx={{ 
                                    color: getDiffColor(metric.diffDirection),
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5
                                }}
                            >
                                {metric.diffDirection === 'up' && <ArrowUpwardIcon sx={{ fontSize: '0.875rem' }} />}
                                {metric.diffDirection === 'down' && <ArrowDownwardIcon sx={{ fontSize: '0.875rem' }} />}
                                {metric.diffValue || '--'}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            )}

            {/* 详情数据差异 */}
            {otherGroups.map(group => (
                <Box key={group.id} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }} title={group.title}>
                        {group.title}
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                        {group.metrics.map(metric => (
                            <Box 
                                key={metric.id}
                                sx={{ 
                                    py: 0.5,
                                    display: 'flex'
                                }}
                            >
                                <Typography 
                                    variant="body2" 
                                    sx={{ 
                                        fontSize: '0.875rem',
                                        color: 'text.secondary',
                                        width: '200px',
                                        flexShrink: 0
                                    }}
                                    title={metric.label}
                                >
                                    {metric.label}:
                                </Typography>
                                <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                    <Typography 
                                        variant="body2" 
                                        sx={{ 
                                            fontSize: '0.875rem',
                                            color: getDiffColor(metric.diffDirection),
                                            fontWeight: 600,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.3
                                        }}
                                    >
                                        {metric.diffDirection === 'up' && <ArrowUpwardIcon sx={{ fontSize: '0.75rem' }} />}
                                        {metric.diffDirection === 'down' && <ArrowDownwardIcon sx={{ fontSize: '0.75rem' }} />}
                                        {metric.diffValue || '--'}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Box>
            ))}
        </Paper>
    );
};

const MetricTable: React.FC<MetricTableProps> = ({ data }) => {
    // 使用数据中的标题，如果没有则使用默认值
    const baselineTitle = data.baselineTitle || '话术 A (基准)';
    const comparisonTitle = data.comparisonTitle || '话术 B (对比)';

    return (
        <Box 
            data-export-area
            sx={{ 
                flexGrow: 1, 
                overflow: 'auto', 
                p: 3, 
                bgcolor: 'background.default',
                display: 'flex',
                gap: 2,
                height: '100%'
            }}
        >
            {/* 左侧基准卡片 */}
            <Box sx={{ flex: 1, minWidth: 0 }} data-card-index="0">
                <MetricCard 
                    title={baselineTitle}
                    data={data}
                    side="baseline"
                    showDiff={false}
                />
            </Box>

            {/* 中间对比卡片 */}
            <Box sx={{ flex: 1, minWidth: 0 }} data-card-index="1">
                <MetricCard 
                    title={comparisonTitle}
                    data={data}
                    side="comparison"
                    showDiff={false}
                />
            </Box>

            {/* 右侧差异卡片 */}
            <Box sx={{ flex: 1, minWidth: 0 }} data-card-index="2">
                <DiffCard data={data} />
            </Box>
        </Box>
    );
};

export default MetricTable;
