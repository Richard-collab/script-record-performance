import type { AnalyticsData, FilterParams, AnalyticsMetric, AnalyticsGroup } from '../types/analytics';
import dayjs from 'dayjs';

interface RawTaskStats {
    outbound_calls: number;
    connected_calls: number;

    // Core metrics
    opening_hangup_count: number;
    duration_total_seconds: number; // For avg_duration
    duration_count: number;
    class_a_duration_total_seconds: number;
    class_a_count: number;

    // Key script hit rates (Counts of hits vs Total relevant sessions)
    opening_hit_count: number;
    main_flow_1_hit_count: number;
    guide_phone_hit_count: number;

    // Key script hangup rates (Counts of hangups at this step vs Total at this step)
    opening_node_hangup_count: number;
    main_flow_1_node_hangup_count: number;

    // Denominators for rates (if different from connected_calls)
    total_sessions: number; // Usually same as connected_calls
}

const MOCK_DB: Record<string, Record<string, RawTaskStats>> = {
    // Script A1
    'A1': {
        '10086': {
            outbound_calls: 450000,
            connected_calls: 8700,
            opening_hangup_count: 5500,
            duration_total_seconds: 243600, // ~28s
            duration_count: 8700,
            class_a_duration_total_seconds: 24000,
            class_a_count: 85,
            opening_hit_count: 8690,
            main_flow_1_hit_count: 2200,
            guide_phone_hit_count: 150,
            opening_node_hangup_count: 4100,
            main_flow_1_node_hangup_count: 700,
            total_sessions: 8700
        },
        '10088': {
            outbound_calls: 450246,
            connected_calls: 8822,
            opening_hangup_count: 5680,
            duration_total_seconds: 247890,
            duration_count: 8822,
            class_a_duration_total_seconds: 26000,
            class_a_count: 90,
            opening_hit_count: 8800,
            main_flow_1_hit_count: 2380,
            guide_phone_hit_count: 168,
            opening_node_hangup_count: 4290,
            main_flow_1_node_hangup_count: 760,
            total_sessions: 8822
        }
    },
    // Script B1
    'B1': {
        '10087': {
            outbound_calls: 198000,
            connected_calls: 8600,
            opening_hangup_count: 6000,
            duration_total_seconds: 200000,
            duration_count: 8600,
            class_a_duration_total_seconds: 34000,
            class_a_count: 85,
            opening_hit_count: 8595,
            main_flow_1_hit_count: 550,
            guide_phone_hit_count: 45,
            opening_node_hangup_count: 5000,
            main_flow_1_node_hangup_count: 180,
            total_sessions: 8600
        },
        '10089': {
            outbound_calls: 198242,
            connected_calls: 8699,
            opening_hangup_count: 6059,
            duration_total_seconds: 206066,
            duration_count: 8699,
            class_a_duration_total_seconds: 35395,
            class_a_count: 88,
            opening_hit_count: 8695,
            main_flow_1_hit_count: 572,
            guide_phone_hit_count: 50,
            opening_node_hangup_count: 5150,
            main_flow_1_node_hangup_count: 190,
            total_sessions: 8699
        }
    }
    // Fallbacks for other scripts can be empty or duplicates
};

const aggregateStats = (statsList: RawTaskStats[]): RawTaskStats => {
    return statsList.reduce((acc, curr) => ({
        outbound_calls: acc.outbound_calls + curr.outbound_calls,
        connected_calls: acc.connected_calls + curr.connected_calls,
        opening_hangup_count: acc.opening_hangup_count + curr.opening_hangup_count,
        duration_total_seconds: acc.duration_total_seconds + curr.duration_total_seconds,
        duration_count: acc.duration_count + curr.duration_count,
        class_a_duration_total_seconds: acc.class_a_duration_total_seconds + curr.class_a_duration_total_seconds,
        class_a_count: acc.class_a_count + curr.class_a_count,
        opening_hit_count: acc.opening_hit_count + curr.opening_hit_count,
        main_flow_1_hit_count: acc.main_flow_1_hit_count + curr.main_flow_1_hit_count,
        guide_phone_hit_count: acc.guide_phone_hit_count + curr.guide_phone_hit_count,
        opening_node_hangup_count: acc.opening_node_hangup_count + curr.opening_node_hangup_count,
        main_flow_1_node_hangup_count: acc.main_flow_1_node_hangup_count + curr.main_flow_1_node_hangup_count,
        total_sessions: acc.total_sessions + curr.total_sessions,
    }), {
        outbound_calls: 0, connected_calls: 0, opening_hangup_count: 0,
        duration_total_seconds: 0, duration_count: 0,
        class_a_duration_total_seconds: 0, class_a_count: 0,
        opening_hit_count: 0, main_flow_1_hit_count: 0, guide_phone_hit_count: 0,
        opening_node_hangup_count: 0, main_flow_1_node_hangup_count: 0,
        total_sessions: 0
    });
};

const formatNumber = (num: number) => num.toLocaleString();
const formatPercent = (num: number, total: number) => total > 0 ? `${((num / total) * 100).toFixed(2)}%` : '0.00%';
const formatDuration = (totalSeconds: number, count: number) => count > 0 ? `${(totalSeconds / count).toFixed(2)}s` : '0.00s';

const calculateDiff = (base: string, comp: string, type: 'number' | 'percent' | 'duration'): { value: string, direction: 'up' | 'down' | 'neutral' } => {
    // Helper to parse values back to numbers for comparison
    const parse = (s: string) => parseFloat(s.replace(/,/g, '').replace(/%/g, '').replace(/s/g, ''));

    const b = parse(base);
    const c = parse(comp);

    if (isNaN(b) || isNaN(c)) return { value: '--', direction: 'neutral' };

    const diff = c - b;
    const direction = diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral';
    const absDiff = Math.abs(diff);

    let formattedDiff = '';
    if (type === 'number') formattedDiff = formatNumber(Math.floor(absDiff));
    if (type === 'percent') formattedDiff = `${absDiff.toFixed(2)}%`;
    if (type === 'duration') formattedDiff = `${absDiff.toFixed(2)}s`;

    return { value: formattedDiff, direction };
};

export const fetchAnalyticsData = async (filters: FilterParams): Promise<AnalyticsData> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Helper to get stats for a selection
    const getStats = (script: string, tasks: string[]) => {
        const scriptData = MOCK_DB[script] || {};
        const availableTasks = Object.keys(scriptData);

        // If no tasks selected, select all
        const tasksToAggregate = (tasks && tasks.length > 0) ? tasks : availableTasks;

        const rawList = tasksToAggregate
            .map(t => scriptData[t])
            .filter((t): t is RawTaskStats => !!t); // Filter out undefined if task doesn't exist

        return aggregateStats(rawList);
    };

    const baseStats = getStats(filters.baselineScript, filters.baselineTask);
    const compStats = getStats(filters.experimentScript, filters.experimentTask);

    // Helper to build a metric
    const createMetric = (
        id: string,
        label: string,
        valueFn: (s: RawTaskStats) => string,
        type: 'number' | 'percent' | 'duration',
        isSubItem = false
    ): AnalyticsMetric => {
        const baselineValue = valueFn(baseStats);
        const comparisonValue = valueFn(compStats);
        const { value: diffValue, direction: diffDirection } = calculateDiff(baselineValue, comparisonValue, type);

        return {
            id,
            label,
            baselineValue,
            comparisonValue,
            diffValue,
            diffDirection,
            isSubItem
        };
    };

    return {
        lastUpdated: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        groups: [
            {
                id: 'core',
                title: 'A/B 测试核心数据',
                icon: 'BarChart',
                metrics: [
                    createMetric('outbound_calls', '外呼量', s => formatNumber(s.outbound_calls), 'number'),
                    createMetric('connected_calls', '接通量', s => formatNumber(s.connected_calls), 'number'),
                    createMetric('hangup_rate', '开场白挂机率', s => formatPercent(s.opening_hangup_count, s.connected_calls), 'percent'),
                    createMetric('avg_duration', '平均通话时长', s => formatDuration(s.duration_total_seconds, s.duration_count), 'duration'),
                    createMetric('class_a_duration', 'A类平均通话时长', s => formatDuration(s.class_a_duration_total_seconds, s.class_a_count), 'duration'),
                ]
            },
            {
                id: 'key_script_hit',
                title: '重点语料命中率详情',
                icon: 'Category',
                metrics: [
                    createMetric('opening', '开场白', s => formatPercent(s.opening_hit_count, s.total_sessions), 'percent'),
                    createMetric('main_flow_1', '主流程1', s => formatPercent(s.main_flow_1_hit_count, s.total_sessions), 'percent'),
                    createMetric('guide_phone', '引导输入手机号', s => formatPercent(s.guide_phone_hit_count, s.total_sessions), 'percent'),
                ]
            },
            {
                id: 'key_script_hangup',
                title: '重点语料挂机率详情',
                icon: 'Category',
                metrics: [
                    createMetric('opening_hangup', '开场白', s => formatPercent(s.opening_node_hangup_count, s.total_sessions), 'percent'),
                    createMetric('main_flow_1_hangup', '主流程1', s => formatPercent(s.main_flow_1_node_hangup_count, s.total_sessions), 'percent'),
                ]
            }
        ]
    };
};
