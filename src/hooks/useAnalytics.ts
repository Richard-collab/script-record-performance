import { useState, useEffect, useRef } from 'react';
import type { AnalyticsData, FilterParams, AnalyticsMetric } from '../types/analytics';
import { fetchAnalyticsData } from '../utils/api';
import { parseUrlParams, serializeFilters } from '../utils/urlParams';
import type { MetricOverride, CustomMetricParams } from '../utils/urlParams';
import { processAnalyticsData, updateMetricInData, applyCustomMetrics, replaceCustomMetrics } from '../utils/dataProcessing';

export const useAnalytics = () => {
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

    const handleSearch = async (
        filters: FilterParams,
        initialOverrides: MetricOverride[] = [],
        initialCustomMetrics: CustomMetricParams[] = []
    ) => {
        setLoading(true);
        try {
            const rawData = await fetchAnalyticsData(
                filters.dateRange,
                filters.baselineScript,
                filters.baselineTask,
                filters.experimentScript,
                filters.experimentTask
            );

            const processedData = processAnalyticsData(rawData, initialOverrides, initialCustomMetrics);

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

    useEffect(() => {
        if (mounted.current) return;
        mounted.current = true;

        const { filters, overrides: urlOverrides, customMetrics: urlCustomMetrics } = parseUrlParams();

        if (filters.dateRange || filters.baselineScript) {
            setInitialFilters(filters);
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

    const handleMetricUpdate = (
        groupId: string,
        metricId: string,
        field: 'baselineValue' | 'comparisonValue',
        newValue: string
    ) => {
        if (!data) return;

        // 1. Update Data (UI) using helper
        const { updatedData, finalValue } = updateMetricInData(data, groupId, metricId, field, newValue);
        setData(updatedData);

        // 2. Update State for URL sync
        const group = updatedData.groups.find(g => g.id === groupId);
        // Note: group might be undefined if not found, but updateMetricInData handles checks.
        // We need to check if it's a custom metric group.
        const isPostProcess = groupId === 'post_process' || (group && group.title === '后程数据');

        if (isPostProcess) {
            const newCustomMetrics = [...customMetrics];
            const targetIndex = newCustomMetrics.findIndex(cm => cm.id === metricId);
            if (targetIndex >= 0) {
                const targetMetric = newCustomMetrics[targetIndex];
                if (targetMetric) {
                    newCustomMetrics[targetIndex] = {
                        ...targetMetric,
                        [field]: finalValue
                    };
                }
            } else {
                const metric = group?.metrics.find(m => m.id === metricId);
                if (metric) {
                    // Explicitly cast to string to fix TS error if any
                    const cm: CustomMetricParams = {
                        id: String(metric.id),
                        label: String(metric.label),
                        baselineValue: String(metric.baselineValue),
                        comparisonValue: String(metric.comparisonValue)
                    };
                    newCustomMetrics.push(cm);
                }
            }
            setCustomMetrics(newCustomMetrics);
        } else {
            // Standard Metric Override
            const newOverrides = [...overrides];
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

        // Deep copy done inside JSON.parse/stringify or explicitly
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

    const handleUpdateCustomMetrics = (newMetrics: CustomMetricParams[]) => {
        if (!data) return;

        setCustomMetrics(newMetrics);
        const updatedData = replaceCustomMetrics(JSON.parse(JSON.stringify(data)), newMetrics);
        setData(updatedData);
    };

    return {
        data,
        loading,
        activeFilters,
        initialFilters,
        urlParsed,
        customMetrics,
        handleSearch,
        handleMetricUpdate,
        handleAddCustomMetric,
        handleAddCustomMetrics,
        handleUpdateCustomMetrics
    };
};
