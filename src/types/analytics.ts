export interface AnalyticsMetric {
    id: string;
    label: string;
    baselineValue: string;
    comparisonValue: string;
    diffValue?: string;
    diffDirection?: 'up' | 'down' | 'neutral';
    diffPercentage?: string;
    isSubItem?: boolean;
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
}

export interface FilterParams {
    dateRange: [Date | null, Date | null];
    baselineScript: string;
    baselineTask: string;
    experimentScript: string;
    experimentTask: string;
}
