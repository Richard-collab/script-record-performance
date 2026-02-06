import type { AnalyticsData, FilterParams } from '../types/analytics';
import dayjs from 'dayjs';

export const fetchAnalyticsData = async (filters: FilterParams): Promise<AnalyticsData> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock data based on the provided screenshot
    return {
        lastUpdated: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        groups: [
            {
                id: 'core',
                title: 'A/B 测试核心数据',
                icon: 'BarChart',
                metrics: [
                    {
                        id: 'outbound_calls',
                        label: '外呼量',
                        baselineValue: '900,246',
                        comparisonValue: '396,242',
                        diffValue: '--',
                        diffDirection: 'neutral'
                    },
                    {
                        id: 'connected_calls',
                        label: '接通量',
                        baselineValue: '17,522',
                        comparisonValue: '17,299',
                        diffValue: '--',
                        diffDirection: 'neutral'
                    },
                    {
                        id: 'hangup_rate',
                        label: '开场白挂机率',
                        baselineValue: '63.79%',
                        comparisonValue: '69.71%',
                        diffValue: '5.92%',
                        diffDirection: 'up'
                    },
                    {
                        id: 'avg_duration',
                        label: '平均通话时长',
                        baselineValue: '28.04s',
                        comparisonValue: '23.47s',
                        diffValue: '4.57s',
                        diffDirection: 'up'
                    },
                    {
                        id: 'class_a_duration',
                        label: 'A类平均通话时长',
                        baselineValue: '284.15s',
                        comparisonValue: '401.12s',
                        diffValue: '116.97s',
                        diffDirection: 'up'
                    }
                ]
            },
            {
                id: 'key_script_hit',
                title: '重点语料命中率详情',
                icon: 'Category',
                metrics: [
                    {
                        id: 'opening',
                        label: '开场白',
                        baselineValue: '99.82%',
                        comparisonValue: '99.97%',
                        diffValue: '0.15%',
                        diffDirection: 'up'
                    },
                    {
                        id: 'main_flow_1',
                        label: '主流程1',
                        baselineValue: '26.19%',
                        comparisonValue: '6.49%',
                        diffValue: '19.70%',
                        diffDirection: 'up'
                    },
                    {
                        id: 'guide_phone',
                        label: '引导输入手机号',
                        baselineValue: '1.82%',
                        comparisonValue: '0.55%',
                        diffValue: '1.27%',
                        diffDirection: 'up'
                    }
                ]
            },
            {
                id: 'key_script_hangup',
                title: '重点语料挂机率详情',
                icon: 'Category',
                metrics: [
                    {
                        id: 'opening_hangup',
                        label: '开场白',
                        baselineValue: '47.89%',
                        comparisonValue: '58.67%',
                        diffValue: '10.78%',
                        diffDirection: 'up'
                    },
                    {
                        id: 'main_flow_1_hangup',
                        label: '主流程1',
                        baselineValue: '32.19%',
                        comparisonValue: '33.16%',
                        diffValue: '0.97%',
                        diffDirection: 'up'
                    }
                ]
            }
        ]
    };
};
