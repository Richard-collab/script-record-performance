export interface AnalyticsMetric {
    id: string;
    label: string;
    baselineValue: string;
    comparisonValue: string;
    diffValue?: string;
    diffDirection?: 'up' | 'down' | 'neutral';
    diffPercentage?: string;
    isSubItem?: boolean;
    // 漏斗转化率（相对于接通量）
    funnelRate?: string;
}

export interface AnalyticsGroup {
    id: string;
    title: string;
    icon?: string; // Icon name reference
    metrics: AnalyticsMetric[];
}

export interface AnalyticsData {
    groups: AnalyticsGroup[];
    lastUpdated: string;
    baselineTitle?: string;
    comparisonTitle?: string;
}

export interface FilterParams {
    dateRange: [Date | null, Date | null];
    baselineScript: string;
    baselineTask: string | string[];  // 支持单选或多选
    experimentScript: string;
    experimentTask: string | string[];  // 支持单选或多选
}
