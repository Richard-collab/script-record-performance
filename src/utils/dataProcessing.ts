import type { AnalyticsData } from '../types/analytics';
import type { MetricOverride, CustomMetricParams } from './urlParams';
import { recalculateMetricDiff, extractMainValue, calculateDecayRate } from './calculations';

export const ensurePostProcessGroup = (updatedData: AnalyticsData): AnalyticsData => {
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

export const applyCustomMetrics = (data: AnalyticsData, currentCustom: CustomMetricParams[]): AnalyticsData => {
    if (!currentCustom.length) return data;

    // data passed here is expected to be mutable (e.g. deep copied before)
    // But ensurePostProcessGroup might mutate it.
    // If we want this function to be pure regarding the input 'data', we should copy it.
    // However, processAnalyticsData calls this on a deep copy.
    // Let's assume input is mutable for performance if called from processAnalyticsData,
    // but we should be careful.

    // Actually, ensurePostProcessGroup modifies the array in place if we are not careful.
    // Let's assume the caller manages the copy for now to avoid double cloning in processAnalyticsData.

    let updatedData = ensurePostProcessGroup(data);
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

export const applyOverrides = (data: AnalyticsData, currentOverrides: MetricOverride[]): AnalyticsData => {
    if (!currentOverrides.length) return data;

    currentOverrides.forEach(ov => {
        const group = data.groups.find(g => g.id === ov.groupId);
        if (group) {
            const metric = group.metrics.find(m => m.id === ov.metricId);
            if (metric) {
                 metric[ov.field] = ov.value;
            }
        }
    });
    return data;
};

export const processAnalyticsData = (
    rawData: AnalyticsData,
    overrides: MetricOverride[],
    customMetrics: CustomMetricParams[]
): AnalyticsData => {
    // Deep copy to avoid mutating cache if any
    let processedData = JSON.parse(JSON.stringify(rawData));

    // Apply custom metrics first
    processedData = applyCustomMetrics(processedData, customMetrics);

    // Apply overrides
    processedData = applyOverrides(processedData, overrides);

    // Re-calculate diffs for all metrics
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

    return processedData;
};

export const updateMetricInData = (
    data: AnalyticsData,
    groupId: string,
    metricId: string,
    field: 'baselineValue' | 'comparisonValue',
    newValue: string
): { updatedData: AnalyticsData; finalValue: string } => {
    // Create a deep copy to ensure immutability of the original state
    const updatedData = JSON.parse(JSON.stringify(data));

    const group = updatedData.groups.find((g: any) => g.id === groupId);
    if (!group) return { updatedData: data, finalValue: newValue }; // Return original if not found

    const metricIndex = group.metrics.findIndex((m: any) => m.id === metricId);
    if (metricIndex === -1) return { updatedData: data, finalValue: newValue };

    const metric = group.metrics[metricIndex];

    // Check if original value contains decay rate
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

        // Update subsequent metrics' decay rates
        for (let i = metricIndex + 1; i < group.metrics.length; i++) {
            const nextMetric = group.metrics[i];
            const prevMetric = group.metrics[i - 1];
            const nextField = field;

            if (nextMetric[nextField].includes('[')) {
                const nextMainValue = extractMainValue(nextMetric[nextField]);
                const prevMainValue = extractMainValue(prevMetric[nextField]);
                const nextDecayRate = calculateDecayRate(nextMainValue, prevMainValue);
                nextMetric[nextField] = `${nextMainValue} [${nextDecayRate}]`;
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

    return { updatedData, finalValue };
};
