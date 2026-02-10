import dayjs from 'dayjs';
import type { FilterParams } from '../types/analytics';

export interface MetricOverride {
    groupId: string;
    metricId: string;
    field: 'baselineValue' | 'comparisonValue';
    value: string;
}

export interface CustomMetricParams {
    id: string;
    label: string;
    baselineValue: string;
    comparisonValue: string;
}

export const serializeFilters = (
    filters: FilterParams,
    overrides: MetricOverride[],
    customMetrics: CustomMetricParams[]
): string => {
    const params = new URLSearchParams();

    // Date
    if (filters.dateRange[0]) {
        params.set('date', dayjs(filters.dateRange[0]).format('YYYY-MM-DD'));
    }
    
    // Baseline
    if (filters.baselineScript) params.set('bs', filters.baselineScript);
    if (filters.baselineTask) {
        const tasks = Array.isArray(filters.baselineTask) ? filters.baselineTask : [filters.baselineTask];
        if (tasks.length > 0) params.set('bt', tasks.join(','));
    }

    // Experiment
    if (filters.experimentScript) params.set('es', filters.experimentScript);
    if (filters.experimentTask) {
        const tasks = Array.isArray(filters.experimentTask) ? filters.experimentTask : [filters.experimentTask];
        if (tasks.length > 0) params.set('et', tasks.join(','));
    }

    // Overrides
    if (overrides.length > 0) {
        try {
            const json = JSON.stringify(overrides);
            const encoded = btoa(encodeURIComponent(json));
            params.set('od', encoded);
        } catch (e) {
            console.error('Failed to encode overrides', e);
        }
    }

    // Custom Metrics
    if (customMetrics.length > 0) {
        try {
            const json = JSON.stringify(customMetrics);
            const encoded = btoa(encodeURIComponent(json));
            params.set('cm', encoded);
        } catch (e) {
            console.error('Failed to encode custom metrics', e);
        }
    }

    return params.toString();
};

export const parseUrlParams = (): { 
    filters: Partial<FilterParams>, 
    overrides: MetricOverride[],
    customMetrics: CustomMetricParams[]
} => {
    const params = new URLSearchParams(window.location.search);
    const dateStr = params.get('date');
    const bs = params.get('bs');
    const bt = params.get('bt');
    const es = params.get('es');
    const et = params.get('et');
    const od = params.get('od');
    const cm = params.get('cm');

    const filters: Partial<FilterParams> = {};
    if (dateStr) {
        const d = new Date(dateStr);
        filters.dateRange = [d, d]; 
    }
    if (bs) filters.baselineScript = bs;
    if (bt) filters.baselineTask = bt.split(',');
    if (es) filters.experimentScript = es;
    if (et) filters.experimentTask = et.split(',');

    let overrides: MetricOverride[] = [];
    if (od) {
        try {
            const json = decodeURIComponent(atob(od));
            overrides = JSON.parse(json);
        } catch (e) {
            console.error('Failed to parse overrides', e);
        }
    }

    let customMetrics: CustomMetricParams[] = [];
    if (cm) {
        try {
            const json = decodeURIComponent(atob(cm));
            customMetrics = JSON.parse(json);
        } catch (e) {
            console.error('Failed to parse custom metrics', e);
        }
    }

    return { filters, overrides, customMetrics };
};
