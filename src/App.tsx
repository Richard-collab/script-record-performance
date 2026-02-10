import React, { useEffect, useState, useRef } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import DashboardLayout from './components/DashboardLayout';
import FilterPanel from './components/FilterPanel';
import Header from './components/Header';
import MetricTable from './components/MetricTable';
import { fetchAnalyticsData } from './utils/api';
import { recalculateMetricDiff, extractMainValue, extractDecayRate, calculateDecayRate } from './utils/calculations';
import type { AnalyticsData, FilterParams } from './types/analytics';
import { parseUrlParams, serializeFilters, type MetricOverride, type CustomMetricParams } from './utils/urlParams';
import { Box, CircularProgress, Typography } from '@mui/material';

// Custom theme to match the clean, professional look
const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2', // Standard blue
        },
        background: {
            default: '#f4f6f8', // Light gray background
            paper: '#ffffff',
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        button: {
            textTransform: 'none', // Remove uppercase default
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: 'none',
                    },
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderBottom: '1px solid #f0f0f0',
                },
                head: {
                    backgroundColor: '#f9fafb',
                    fontWeight: 600,
                }
            }
        }
    },
});

function App() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(false);

    // State for URL synchronization
    const [activeFilters, setActiveFilters] = useState<Partial<FilterParams>>({});
    const [overrides, setOverrides] = useState<MetricOverride[]>([]);
    const [customMetrics, setCustomMetrics] = useState<CustomMetricParams[]>([]);
    const [initialFilters, setInitialFilters] = useState<Partial<FilterParams> | undefined>(undefined);
    
    // To avoid double fetch on mount strict mode or similar
    const mounted = useRef(false);

    const [urlParsed, setUrlParsed] = useState(false);

    useEffect(() => {
        if (mounted.current) return;
        mounted.current = true;

        const { filters, overrides: urlOverrides, customMetrics: urlCustomMetrics } = parseUrlParams();
        
        if (filters.dateRange || filters.baselineScript) {
            setInitialFilters(filters);
            // 这里我们需要构造完整的 FilterParams 来调用 search
            // 如果 URL 参数缺省，可能需要处理. 
            // 假设 FilterPanel 会处理必填项，但这里是直接调用 handleSearch
            // 只有当参数足够完整时才搜索
            if (filters.dateRange && filters.baselineScript && filters.experimentScript) {
                 handleSearch(filters as FilterParams, urlOverrides, urlCustomMetrics);
            }
        }
        setUrlParsed(true);
    }, []);

    // Sync URL whenever state changes
    useEffect(() => {
        if (data && activeFilters.baselineScript) { // Ensure we have active data before syncing
            const url = serializeFilters(activeFilters as FilterParams, overrides, customMetrics);
            const newUrl = `${window.location.pathname}?${url}`;
            window.history.pushState({ path: newUrl }, '', newUrl);
        }
    }, [activeFilters, overrides, customMetrics, data]);

    const applyOverrides = (data: AnalyticsData, currentOverrides: MetricOverride[]) => {
        if (!currentOverrides.length) return data;
        
        currentOverrides.forEach(ov => {
            const group = data.groups.find(g => g.id === ov.groupId);
            if (group) {
                const metric = group.metrics.find(m => m.id === ov.metricId);
                if (metric) {
                     // Apply logic similar to handleMetricUpdate but simpler or reuse logic
                     // Ideally we should reuse the calculation logic.
                     // But here we might just set the value and rely on handleMetricUpdate logic to propagate?
                     // No, handleMetricUpdate is for user interaction. 
                     // Here we reconstruct the state.
                     // For simplicity, we just set the value. 
                     // If we need recalculation (decay rate), we should duplicate that logic or extract it.
                     // The handleMetricUpdate logic is complex (decay rates). 
                     // Let's assume for now overrides are just values. 
                     // To be correct, we should probably run the "Update" logic for each override.
                     metric[ov.field] = ov.value;
                }
            }
        });
        return data; // Mutated in place or via shallow copies deep down
    };

    const applyCustomMetrics = (data: AnalyticsData, currentCustom: CustomMetricParams[]): AnalyticsData => {
        if (!currentCustom.length) return data;

        let updatedData = ensurePostProcessGroup({ ...data, groups: [...data.groups] });
        const targetGroup = updatedData.groups.find(
            group => group.title === '后程数据' || group.id === 'post_process'
        );

        if (targetGroup) {
            currentCustom.forEach(cm => {
                // Determine if metric already exists (avoid dupes if re-applying)
                if (!targetGroup.metrics.find(m => m.id === cm.id)) {
                    const { diffValue, diffPercentage, diffDirection } = recalculateMetricDiff(
                        cm.baselineValue,
                        cm.comparisonValue
                    );
                    targetGroup.metrics.push({
                        id: cm.id,
                        label: cm.label,
                        baselineValue: cm.baselineValue,
                        comparisonValue: cm.comparisonValue,
                        diffValue,
                        diffPercentage,
                        diffDirection
                    });
                }
            });
        }
        return updatedData;
    };


    const handleSearch = async (
        filters: FilterParams, 
        initialOverrides: MetricOverride[] = [], 
        initialCustomMetrics: CustomMetricParams[] = []
    ) => {
        setLoading(true);
        // 如果是用户点击搜索 (initial... are empty/undefined), 我们清除之前的 overrides
        // 如果是 URL 加载 (pass in values), 我们保留
        // 这里通过参数控制

        try {
            const rawData = await fetchAnalyticsData(
                filters.dateRange,
                filters.baselineScript,
                filters.baselineTask,
                filters.experimentScript,
                filters.experimentTask
            );
            
            // Deep copy to avoid mutating cache if any
            let processedData = JSON.parse(JSON.stringify(rawData));
            
            // Apply custom metrics first (as they might be overrides target? probably not)
            processedData = applyCustomMetrics(processedData, initialCustomMetrics);

            // Apply overrides
            // Note: Simplistic application here. If overrides depend on calculation, 
            // we might need a more robust method.
            processedData = applyOverrides(processedData, initialOverrides);

            // Re-calculate diffs for overridden metrics?
            // The applyOverrides just set the value. We should probably recalc diffs.
            // Iterating all metrics to calc diff is safe.
            processedData.groups.forEach((g: any) => {
                g.metrics.forEach((m: any) => {
                     const { diffValue, diffPercentage, diffDirection } = recalculateMetricDiff(
                        m.baselineValue,
                        m.comparisonValue
                    );
                    m.diffValue = diffValue;
                    m.diffPercentage = diffPercentage;
                    m.diffDirection = diffDirection;
                });
            });

            setData(processedData);
            setActiveFilters(filters);
            setOverrides(initialOverrides);
            setCustomMetrics(initialCustomMetrics);

        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    // 处理指标值的更新
    const handleMetricUpdate = (
        groupId: string,
        metricId: string,
        field: 'baselineValue' | 'comparisonValue',
        newValue: string
    ) => {
        if (!data) return;

        // 1. Update Data (UI)
        const updatedData = { ...data };
        const group = updatedData.groups.find(g => g.id === groupId);
        if (!group) return;

        const metricIndex = group.metrics.findIndex(m => m.id === metricId);
        if (metricIndex === -1) return;

        const metric = group.metrics[metricIndex];

        // 检查原始值是否包含衰减率（方括号）
        const hasDecayRate = metric[field].includes('[');
        let finalValue = newValue;

        if (hasDecayRate) {
            const newMainValue = extractMainValue(newValue);
            let decayRate = '100%'; 
            
            if (metricIndex > 0) {
                const prevMetric = group.metrics[metricIndex - 1];
                const prevMainValue = extractMainValue(prevMetric[field]);
                decayRate = calculateDecayRate(newMainValue, prevMainValue);
            }
            
            finalValue = `${newMainValue} [${decayRate}]`;
            metric[field] = finalValue;
            
            // 更新后续所有指标的衰减率
            for (let i = metricIndex + 1; i < group.metrics.length; i++) {
                const nextMetric = group.metrics[i];
                const prevMetric = group.metrics[i - 1];
                const nextField = field;
                
                if (nextMetric[nextField].includes('[')) {
                    const nextMainValue = extractMainValue(nextMetric[nextField]);
                    const prevMainValue = extractMainValue(prevMetric[nextField]);
                    const nextDecayRate = calculateDecayRate(nextMainValue, prevMainValue);
                    nextMetric[nextField] = `${nextMainValue} [${nextDecayRate}]`;
                    
                    // 这里可能会产生连锁反应, 需要记录所有的变更到 overrides
                    // 为简化，暂时只记录当前用户的编辑。
                    // 但如果是自动计算的变更，如果不记录，刷新后会丢失吗？
                    // 只要原始数据 + 用户编辑 能还原即可。
                    // 但是这里既然 UI 计算了，最好都存下来，或者依靠重新计算。
                }
            }
        } else {
            metric[field] = newValue;
        }

        const { diffValue, diffPercentage, diffDirection } = recalculateMetricDiff(
            metric.baselineValue,
            metric.comparisonValue
        );
        metric.diffValue = diffValue;
        metric.diffPercentage = diffPercentage;
        metric.diffDirection = diffDirection;

        setData(updatedData);

        // 2. Update State for URL sync
        
        // Check if it's a Custom Metric (Post Process group)
        if (groupId === 'post_process' || group.title === '后程数据') {
            const newCustomMetrics = [...customMetrics];
            const targetIndex = newCustomMetrics.findIndex(cm => cm.id === metricId);
            if (targetIndex >= 0) {
                newCustomMetrics[targetIndex] = {
                    ...newCustomMetrics[targetIndex],
                    [field]: finalValue
                };
            } else {
                // Changing a custom metric that isn't in state? 
                // Maybe it was added via UI but state sync lagged? 
                // Should seek it in updatedData
                newCustomMetrics.push({
                    id: metric.id,
                    label: metric.label,
                    baselineValue: metric.baselineValue,
                    comparisonValue: metric.comparisonValue
                });
            }
            setCustomMetrics(newCustomMetrics);
        } else {
            // Standard Metric Override
            const newOverrides = [...overrides];
            // Remove existing override for this field/metric if any
            const existingIndex = newOverrides.findIndex(o => o.groupId === groupId && o.metricId === metricId && o.field === field);
            
            const override: MetricOverride = {
                groupId,
                metricId,
                field,
                value: finalValue
            };

            if (existingIndex >= 0) {
                newOverrides[existingIndex] = override;
            } else {
                newOverrides.push(override);
            }
            setOverrides(newOverrides);
        }
    };

    const ensurePostProcessGroup = (updatedData: AnalyticsData): AnalyticsData => {
        let targetGroupIndex = updatedData.groups.findIndex(
            group => group.title === '后程数据' || group.id === 'post_process'
        );

        if (targetGroupIndex === -1) {
            const insertAfterIndex = updatedData.groups.findIndex(
                group => group.id === 'intention_hit' || group.title === '意图命中率详情'
            );
            const insertIndex = insertAfterIndex >= 0 ? insertAfterIndex + 1 : updatedData.groups.length;
            updatedData.groups.splice(insertIndex, 0, {
                id: 'post_process',
                title: '后程数据',
                metrics: []
            });
        }

        return updatedData;
    };

    const handleAddCustomMetric = (label: string, baselineValue: string, comparisonValue: string) => {
        if (!data) return;
        
        const newId = `custom-${Date.now()}`;
        const newMetric: CustomMetricParams = {
            id: newId,
            label,
            baselineValue,
            comparisonValue
        };

        const newCustomMetrics = [...customMetrics, newMetric];
        setCustomMetrics(newCustomMetrics);

        const updatedData = applyCustomMetrics(JSON.parse(JSON.stringify(data)), [newMetric]);
        setData(updatedData);
    };

    const handleAddCustomMetrics = (rows: { label: string; baselineValue: string; comparisonValue: string }[]) => {
        if (!data || rows.length === 0) return;

        const newMetrics: CustomMetricParams[] = rows.map((row, index) => ({
            id: `custom-${Date.now()}-${index}`,
            label: row.label,
            baselineValue: row.baselineValue,
            comparisonValue: row.comparisonValue
        }));

        const newCustomMetrics = [...customMetrics, ...newMetrics];
        setCustomMetrics(newCustomMetrics);

        const updatedData = applyCustomMetrics(JSON.parse(JSON.stringify(data)), newMetrics);
        setData(updatedData);
    };

    return (
        <ThemeProvider theme={theme}>
            <DashboardLayout>
                <Box sx={{ display: 'flex', height: '100%' }}>
                    <FilterPanel 
                        key={urlParsed ? 'loaded' : 'loading'}
                        onSearch={(filters) => handleSearch(filters)} // Clear overrides on new search
                        initialFilters={initialFilters} 
                    />
                    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', bgcolor: 'background.default' }}>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                <CircularProgress />
                            </Box>
                        ) : data ? (
                            <>
                                <Header
                                    lastUpdated={data.lastUpdated}
                                    data={data}
                                    onAddMetric={handleAddCustomMetric}
                                    onAddMetrics={handleAddCustomMetrics}
                                />
                                <MetricTable data={data} onMetricUpdate={handleMetricUpdate} />
                            </>
                        ) : (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: 2 }}>
                                <Typography variant="h6" color="text.secondary">
                                    请在左侧筛选面板选择分析参数
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    选择日期、基准话术和实验话术后，点击"开始分析"按钮
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
            </DashboardLayout>
        </ThemeProvider>
    );
}

export default App;
