/**
 * 从格式化的字符串中提取数值
 * 支持格式: "123", "123 [45%]", "12,345", "12.34%"
 */
export const extractNumericValue = (value: string): number | null => {
    if (!value || value === '--' || value === 'N/A') return null;
    
    // 如果包含 [xx%] 格式，提取前面的数值
    const match = value.match(/^([\d,]+(?:\.\d+)?)\s*\[/);
    if (match && match[1]) {
        return parseFloat(match[1].replace(/,/g, ''));
    }
    
    // 移除逗号和百分号，提取数字
    const cleaned = value.replace(/,/g, '').replace(/%/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
};

/**
 * 计算两个数值之间的差异
 * @param baselineStr - 基准值字符串
 * @param comparisonStr - 对比值字符串
 * @returns 包含差异值、百分比和方向的对象
 */
export const calculateDifference = (
    baselineStr: string,
    comparisonStr: string
): {
    diffValue: string;
    diffPercentage: string;
    diffDirection: 'up' | 'down' | 'neutral';
} => {
    const baseline = extractNumericValue(baselineStr);
    const comparison = extractNumericValue(comparisonStr);

    if (baseline === null || comparison === null) {
        return {
            diffValue: '--',
            diffPercentage: '',
            diffDirection: 'neutral'
        };
    }

    const diff = comparison - baseline;
    const percentage = baseline !== 0 ? (diff / baseline) * 100 : 0;

    // 判断方向
    let direction: 'up' | 'down' | 'neutral' = 'neutral';
    if (Math.abs(percentage) < 0.01) {
        direction = 'neutral';
    } else if (diff > 0) {
        direction = 'up';
    } else if (diff < 0) {
        direction = 'down';
    }

    // 格式化差异值
    const diffValue = diff >= 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);
    const diffPercentage = percentage >= 0 
        ? `+${percentage.toFixed(1)}%` 
        : `${percentage.toFixed(1)}%`;

    return {
        diffValue: `${diffValue} (${diffPercentage})`,
        diffPercentage,
        diffDirection: direction
    };
};

/**
 * 提取带有衰减率的百分比值中的主值
 * 例如: "50.00% [80.50%]" -> "50.00%"
 */
export const extractMainValue = (value: string): string => {
    const match = value.match(/^([^[]+)/);
    return match && match[1] ? match[1].trim() : value;
};

/**
 * 提取衰减率部分
 * 例如: "50.00% [80.50%]" -> "80.50%"
 */
export const extractDecayRate = (value: string): string | null => {
    const match = value.match(/\[([^\]]+)\]/);
    return match && match[1] ? match[1] : null;
};

/**
 * 计算衰减率（转化率）
 * @param currentRate - 当前环节的命中率（百分比字符串，如 "50.00%"）
 * @param previousRate - 上一环节的命中率（百分比字符串，如 "62.50%"）
 */
export const calculateDecayRate = (currentRate: string, previousRate: string): string => {
    const current = extractNumericValue(currentRate);
    const previous = extractNumericValue(previousRate);
    
    if (current === null || previous === null || previous === 0) {
        return '100%'; // 默认值
    }
    
    const decayRate = (current / previous) * 100;
    return `${decayRate.toFixed(2)}%`;
};

/**
 * 重新计算单个指标的差异
 */
export const recalculateMetricDiff = (
    baselineValue: string,
    comparisonValue: string
): {
    diffValue: string;
    diffPercentage: string;
    diffDirection: 'up' | 'down' | 'neutral';
} => {
    return calculateDifference(baselineValue, comparisonValue);
};
