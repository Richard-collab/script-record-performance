// 这个文件提供了一些调用接口的例子
//
// 1. getInfoByDate(date)
//    - 作用: 根据日期获取当日使用的脚本/话术名称列表
//    - 返回类型: string[]
//    - 返回示例:
//      [
//        "1组众安贷公众号-众安贷钱包AI拉新-C1.0yd",
//        "1组分期乐挂短-分期乐AI拉新-V1.2yy"
//      ]
//
// 2. getInfoByScript(date, scriptNames)
//    - 作用: 根据日期和脚本名称获取详细的任务执行数据
//    - 返回类型: ScriptTaskData[]
//    - 返回示例:
//      [
//        {
//          "dt": "2026-02-09",
//          "account": "zhongandai999",
//          "script_name": "1组众安贷公众号-众安贷钱包AI拉新-C1.0yd",
//          "template_name": "众安贷钱包-公众号yd",
//          "task_name": "20260209众安_公众号_1",
//          "outbound_count": 214183,
//          "pickup_count": 7494,
//          "opening_hangup_rate": 0.7251501000667111,
//          "average_duration": 18.29,
//          "key_corpus_hit_rate": "{'问候语': 0.9999, '开场白': 0.8105, ...}",
//          ...
//        }
//      ]
// ==========================================
// 类型定义 (Type Definitions)
// ==========================================

/**
 * 接口返回的基础数据结构
 * 根据实际数据库字段进行扩展
 */
export interface ScriptTaskData {
  script_name?: string;
  task_name?: string;
  dt?: string;
  [key: string]: any; // 允许其他动态字段
}

export interface CorpusData {
  script_id: number;
  script_name: string;
  canvas_name: string;
  corpus_name: string;
  corpus_content: string;
}

interface HealthResponse {
  status: string;
  db_path: string;
}

// ==========================================
// 配置 (Configuration)
// ==========================================

const BASE_URL = "/api";

// ==========================================
// 工具函数 (Utils)
// ==========================================

/**
 * 发送请求并解析 JSON 的通用封装
 * * @param endpoint - API 路径 (例如 '/search')
 * @param params - URL查询参数对象
 * @param baseUrl - 基础路径，默认为 BASE_URL
 * @returns 解析后的 JSON 数据
 * @throws {Error} 当 HTTP 状态码不是 2xx 时抛出异常
 */
async function fetchClient<T>(endpoint: string, params?: URLSearchParams, baseUrl: string = BASE_URL): Promise<T> {
  // Handle relative BASE_URL (for proxy) vs Absolute (for direct access)
  let urlString: string;
  if (baseUrl.startsWith('http')) {
      const url = new URL(endpoint, baseUrl);
      if (params) url.search = params.toString();
      urlString = url.toString();
  } else {
      // For relative paths (proxy), construct the string manually or use window.location
      const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      const path = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
      urlString = `${base}${path}`;
      if (params) {
          urlString += `?${params.toString()}`;
      }
  }

  console.log(`\n🚀 Requesting: ${urlString}`);

  try {
    const response = await fetch(urlString);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP Error ${response.status}: ${errorText}`);
    }

    return await response.json() as T;
  } catch (error) {
    console.error(`❌ Request Failed: ${(error as Error).message}`);
    throw error;
  }
}

// ==========================================
// 业务函数 (Business Logic)
// ==========================================

/**
 * 检查服务健康状态
 * GET /health
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const data = await fetchClient<HealthResponse>('/health');
    console.log("✅ Health Check Passed:", data);
    return true;
  } catch {
    return false;
  }
}

/**
 * 搜索任务数据
 * GET /search
 * * @param startDate - 开始日期 (YYYY-MM-DD)
 * @param endDate - 结束日期 (YYYY-MM-DD)
 * @param scriptName - 脚本名称
 * @param taskName - (可选) 任务名称
 */
export async function searchData(
  startDate: string,
  endDate: string,
  scriptName: string,
  taskName?: string
): Promise<void> {
  const params = new URLSearchParams();
  // 前端用 camelCase，后端 API 需要 snake_case
  params.append("start_date", startDate);
  params.append("end_date", endDate);
  params.append("script", scriptName);

  if (taskName) {
    params.append("task", taskName);
  }

  try {
    const results = await fetchClient<ScriptTaskData[]>('/search', params);
    console.log(`✅ Search Successful: Found ${results.length} records.`);
    if (results.length > 0) {
      console.log("📄 Sample:", results[0]);
    }
  } catch (error) {
    // 错误已在 fetchClient 中打印，此处可忽略或处理特定逻辑
  }
}

/**
 * 根据日期获取脚本信息
 * GET /getInfoByDate
 * * @param date - 查询日期 (YYYY-MM-DD)
 * @param scriptName - (可选) 筛选特定脚本名称
 */
export async function getInfoByDate(date: string, scriptName?: string): Promise<string[]> {
  const params = new URLSearchParams();
  params.append("date", date);

  if (scriptName) {
    params.append("script_name", scriptName);
  }

  try {
    // 根据 Python 代码，这里返回的是 List[str]
    const results = await fetchClient<string[]>('/getInfoByDate', params);
    
    console.log("📜 Raw Response:", results);
    console.log(`✅ GetInfoByDate Successful: Found ${results.length} records.`);
    return results; // Return the results
  } catch (error) {
    // 错误处理
    console.error("Error fetching scripts by date:", error);
    return [];
  }
}

/**
 * 根据脚本列表获取详细信息
 * GET /getInfoByScript
 * * @param date - 查询日期 (YYYY-MM-DD)
 * @param scriptNames - 脚本名称 (单个字符串或字符串数组)
 */
export async function getInfoByScript(date: string, scriptNames: string | string[]): Promise<ScriptTaskData[]> {
  const params = new URLSearchParams();
  params.append("date", date);

  // 处理数组参数：FastAPI 期望格式为 ?script_name=A&script_name=B
  if (Array.isArray(scriptNames)) {
    scriptNames.forEach(name => params.append("script_name", name));
  } else {
    params.append("script_name", scriptNames);
  }

  try {
    const results = await fetchClient<ScriptTaskData[]>('/getInfoByScript', params);
    
    console.log("📜 Raw Response:", results);
    console.log(`✅ GetInfoByScript Successful: Found ${results.length} records.`);
    return results; // Return the results
  } catch (error) {
    // 错误处理
    console.error("Error fetching info by script:", error);
    return [];
  }
}

/**
 * 根据脚本名称获取语料信息
 * GET /getCorpusByScript
 * @param scriptName - 脚本名称
 */
export async function getCorpusByScript(scriptName: string): Promise<CorpusData[]> {
  const params = new URLSearchParams();
  params.append("script_name", scriptName);

  try {
    const results = await fetchClient<CorpusData[]>('/getCorpusByScript', params, '/corpus');
    console.log(`✅ GetCorpusByScript Successful: Found ${results.length} records.`);
    return results;
  } catch (error) {
    console.error("Error fetching corpus by script:", error);
    return [];
  }
}

// ==========================================
// 数据转换函数 (Data Transformation)
// ==========================================

import type { AnalyticsData, AnalyticsGroup, AnalyticsMetric } from '../types/analytics';
import dayjs from 'dayjs';

/**
 * 解析 key_corpus_hit_rate 字符串为对象
 * 输入示例："{'问候语': 0.9999, '开场白': 0.8105, ...}" (Python dict格式)
 */
function parseKeyCorpusHitRate(hitRateStr?: string): Record<string, number> {
  if (!hitRateStr) return {};
  
  try {
    // 先尝试将Python dict格式转换为JSON格式
    // 将单引号替换为双引号
    const jsonStr = hitRateStr.replace(/'/g, '"');
    return JSON.parse(jsonStr);
  } catch {
    // 如果JSON解析失败，尝试手动解析
    const result: Record<string, number> = {};
    
    // 匹配 '键': 数值 或 "键": 数值 的模式
    const patterns = [
      /['"]([^'"]+)['"]\s*:\s*([\d.]+)/g,  // 带引号的键
      /(\w+)\s*:\s*([\d.]+)/g              // 不带引号的键
    ];
    
    for (const pattern of patterns) {
      const matches = hitRateStr.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[2]) {
          result[match[1]] = parseFloat(match[2]);
        }
      }
    }
    
    return result;
  }
}

/**
 * 聚合多个任务的数据
 * 当用户选择"全部任务"时，将多个任务的数据合并计算
 * @param tasks - 任务数据数组
 * @returns 聚合后的单个任务数据
 */
function aggregateTaskData(tasks: ScriptTaskData[]): ScriptTaskData {
  if (tasks.length === 0) {
    return {};
  }
  
  if (tasks.length === 1) {
    return tasks[0] || {};
  }

  // 初始化聚合结果
  const aggregated: ScriptTaskData = {
    dt: tasks[0]?.dt,
    script_name: tasks[0]?.script_name,
    task_name: '全部任务',
    outbound_count: 0,
    pickup_count: 0,
  };

  // 用于存储需要加权平均的字段
  let totalPickupForDuration = 0;
  let weightedDuration = 0;
  let weightedAClassDuration = 0;

  // 用于计算rate相关字段的分子分母
  const rateCalculations: Record<string, { numerator: number; denominator: number }> = {};

  // 遍历所有任务进行聚合
  tasks.forEach(task => {
    // 1. 数量类字段：直接累加
    const outboundCount = typeof task.outbound_count === 'number' ? task.outbound_count : 0;
    const pickupCount = typeof task.pickup_count === 'number' ? task.pickup_count : 0;
    
    aggregated.outbound_count = (aggregated.outbound_count || 0) + outboundCount;
    aggregated.pickup_count = (aggregated.pickup_count || 0) + pickupCount;

    // 2. 平均时长：加权平均（按接通量加权）
    // 过滤掉"未找到对应数据"这样的无效值
    const avgDuration = typeof task.average_duration === 'number' ? task.average_duration : 0;
    const aClassDuration = typeof task.A_class_avg_duration === 'number' ? task.A_class_avg_duration : 0;
    
    if (pickupCount > 0 && avgDuration > 0) {
      totalPickupForDuration += pickupCount;
      weightedDuration += avgDuration * pickupCount;
    }
    
    if (pickupCount > 0 && aClassDuration > 0) {
      weightedAClassDuration += aClassDuration * pickupCount;
    }

    // 3. 比率类字段：需要根据基数重新计算
    const openingHangupRate = typeof task.opening_hangup_rate === 'number' ? task.opening_hangup_rate : 0;
    const silenceHangupRate = typeof task.silence_hangup_rate === 'number' ? task.silence_hangup_rate : 0;
    
    // 开场白挂机率 = 开场白挂机数 / 接通数
    if (pickupCount > 0 && openingHangupRate > 0) {
      if (!rateCalculations.opening_hangup_rate) {
        rateCalculations.opening_hangup_rate = { numerator: 0, denominator: 0 };
      }
      const openingHangupCount = openingHangupRate * pickupCount;
      rateCalculations.opening_hangup_rate.numerator += openingHangupCount;
      rateCalculations.opening_hangup_rate.denominator += pickupCount;
    }

    // 沉默挂机率 = 沉默挂机数 / 接通数
    if (pickupCount > 0 && silenceHangupRate > 0) {
      if (!rateCalculations.silence_hangup_rate) {
        rateCalculations.silence_hangup_rate = { numerator: 0, denominator: 0 };
      }
      const silenceHangupCount = silenceHangupRate * pickupCount;
      rateCalculations.silence_hangup_rate.numerator += silenceHangupCount;
      rateCalculations.silence_hangup_rate.denominator += pickupCount;
    }

    // 4. 处理字典类字段（key_corpus_hit_rate等）
    // 这些字段需要分别聚合每个key的值
    // 过滤掉"未找到对应数据"这样的无效值
    ['key_corpus_hit_rate', 'key_corpus_hangup_rate_1', 'key_knowledge_base_hit_rate', 'key_intention_hit_rate'].forEach(field => {
      const rateStr = task[field];
      if (rateStr && typeof rateStr === 'string' && rateStr !== '未找到对应数据' && pickupCount > 0) {
        const rateObj = parseKeyCorpusHitRate(rateStr);
        Object.keys(rateObj).forEach(key => {
          const rateKey = `${field}_${key}`;
          if (!rateCalculations[rateKey]) {
            rateCalculations[rateKey] = { numerator: 0, denominator: 0 };
          }
          // 对于命中率类指标，分子是命中数（rate * pickup_count），分母是接通数
          const hitCount = (rateObj[key] || 0) * pickupCount;
          rateCalculations[rateKey].numerator += hitCount;
          rateCalculations[rateKey].denominator += pickupCount;
        });
      }
    });
  });

  // 计算聚合后的平均时长
  if (totalPickupForDuration > 0) {
    aggregated.average_duration = weightedDuration / totalPickupForDuration;
    aggregated.A_class_avg_duration = weightedAClassDuration / totalPickupForDuration;
  } else {
    // 如果没有接通数据，设置为 0
    aggregated.average_duration = 0;
    aggregated.A_class_avg_duration = 0;
  }

  // 计算聚合后的比率
  Object.keys(rateCalculations).forEach(key => {
    const calc = rateCalculations[key];
    if (!calc) return;
    
    const { numerator, denominator } = calc;
    const rate = denominator > 0 ? numerator / denominator : 0;

    if (key === 'opening_hangup_rate') {
      aggregated.opening_hangup_rate = rate;
    } else if (key === 'silence_hangup_rate') {
      aggregated.silence_hangup_rate = rate;
    } else if (key.startsWith('key_corpus_hit_rate_')) {
      // 重构字典类字段
      const corpusKey = key.replace('key_corpus_hit_rate_', '');
      if (!aggregated.key_corpus_hit_rate) {
        aggregated.key_corpus_hit_rate = '{}';
      }
      const rateObj = parseKeyCorpusHitRate(aggregated.key_corpus_hit_rate);
      rateObj[corpusKey] = rate;
      aggregated.key_corpus_hit_rate = JSON.stringify(rateObj).replace(/"/g, "'");
    } else if (key.startsWith('key_corpus_hangup_rate_1_')) {
      const corpusKey = key.replace('key_corpus_hangup_rate_1_', '');
      if (!aggregated.key_corpus_hangup_rate_1) {
        aggregated.key_corpus_hangup_rate_1 = '{}';
      }
      const rateObj = parseKeyCorpusHitRate(aggregated.key_corpus_hangup_rate_1);
      rateObj[corpusKey] = rate;
      aggregated.key_corpus_hangup_rate_1 = JSON.stringify(rateObj).replace(/"/g, "'");
    } else if (key.startsWith('key_knowledge_base_hit_rate_')) {
      const knowledgeKey = key.replace('key_knowledge_base_hit_rate_', '');
      if (!aggregated.key_knowledge_base_hit_rate) {
        aggregated.key_knowledge_base_hit_rate = '{}';
      }
      const rateObj = parseKeyCorpusHitRate(aggregated.key_knowledge_base_hit_rate);
      rateObj[knowledgeKey] = rate;
      aggregated.key_knowledge_base_hit_rate = JSON.stringify(rateObj).replace(/"/g, "'");
    } else if (key.startsWith('key_intention_hit_rate_')) {
      const intentionKey = key.replace('key_intention_hit_rate_', '');
      if (!aggregated.key_intention_hit_rate) {
        aggregated.key_intention_hit_rate = '{}';
      }
      const rateObj = parseKeyCorpusHitRate(aggregated.key_intention_hit_rate);
      rateObj[intentionKey] = rate;
      aggregated.key_intention_hit_rate = JSON.stringify(rateObj).replace(/"/g, "'");
    }
  });

  return aggregated;
}

/**
 * 格式化数值
 */
function formatNumber(num: number | undefined, decimals: number = 0): string {
  if (num === undefined || num === null || isNaN(num)) return '--';
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * 计算百分比差值
 */
function calculateDiff(baseline: number, comparison: number): {
  diffValue: string;
  diffDirection: 'up' | 'down' | 'neutral';
} {
  // 处理无效值
  const baseVal = isNaN(baseline) || baseline === undefined || baseline === null ? 0 : baseline;
  const compVal = isNaN(comparison) || comparison === undefined || comparison === null ? 0 : comparison;
  
  if (baseVal === 0 || compVal === 0 || baseVal === compVal) {
    return { diffValue: '--', diffDirection: 'neutral' };
  }
  
  const diff = compVal - baseVal;
  const percentage = Math.abs(diff / baseVal * 100);
  
  return {
    diffValue: `${percentage.toFixed(2)}%`,
    diffDirection: diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral'
  };
}

/**
 * 计算数值差值
 */
function calculateAbsoluteDiff(baseline: number, comparison: number): string {
  // 处理无效值
  const baseVal = isNaN(baseline) || baseline === undefined || baseline === null ? 0 : baseline;
  const compVal = isNaN(comparison) || comparison === undefined || comparison === null ? 0 : comparison;
  
  if (baseVal === 0 && compVal === 0) return '--';
  const diff = compVal - baseVal;
  return diff >= 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);
}

/**
 * 获取A/B测试数据并转换为前端展示格式
 * 
 * @param dateRange - 日期范围 [开始日期, 结束日期]
 * @param baselineScript - 基准话术脚本名称
 * @param baselineTask - 基准任务名称（支持单个或多个）
 * @param experimentScript - 实验话术脚本名称
 * @param experimentTask - 实验任务名称（支持单个或多个）
 * @returns 转换后的分析数据
 */
export async function fetchAnalyticsData(
  dateRange: [Date | null, Date | null],
  baselineScript: string,
  baselineTask: string | string[],
  experimentScript: string,
  experimentTask: string | string[]
): Promise<AnalyticsData> {
  const [startDate, endDate] = dateRange;
  
  if (!startDate || !endDate) {
    throw new Error('日期范围不能为空');
  }

  const dateStr = dayjs(startDate).format('YYYY-MM-DD');
  
  try {
    // 并行获取基准组和实验组的数据
    const [baselineData, experimentData] = await Promise.all([
      getInfoByScript(dateStr, baselineScript),
      getInfoByScript(dateStr, experimentScript)
    ]);

    // 处理基准组数据：根据选择的任务进行聚合或筛选
    let baseline: ScriptTaskData | undefined;
    const baselineTasks = (!baselineTask) ? [] : (Array.isArray(baselineTask) ? baselineTask : [baselineTask]);
    
    if (baselineTasks.length === 0 || (baselineTasks.length === 1 && !baselineTasks[0])) {
      // 未选择或空字符串：聚合所有任务
      baseline = aggregateTaskData(baselineData);
    } else if (baselineTasks.length === 1) {
      // 单个任务：筛选指定任务
      baseline = baselineData.find(d => d.task_name === baselineTasks[0]);
    } else {
      // 多个任务：筛选并聚合选中的任务
      const selectedData = baselineData.filter(d => baselineTasks.includes(d.task_name || ''));
      baseline = aggregateTaskData(selectedData);
    }

    // 处理实验组数据：根据选择的任务进行聚合或筛选
    let experiment: ScriptTaskData | undefined;
    const experimentTasks = (!experimentTask) ? [] : (Array.isArray(experimentTask) ? experimentTask : [experimentTask]);
    
    if (experimentTasks.length === 0 || (experimentTasks.length === 1 && !experimentTasks[0])) {
      // 未选择或空字符串：聚合所有任务
      experiment = aggregateTaskData(experimentData);
    } else if (experimentTasks.length === 1) {
      // 单个任务：筛选指定任务
      experiment = experimentData.find(d => d.task_name === experimentTasks[0]);
    } else {
      // 多个任务：筛选并聚合选中的任务
      const selectedData = experimentData.filter(d => experimentTasks.includes(d.task_name || ''));
      experiment = aggregateTaskData(selectedData);
    }

    if (!baseline || !experiment) {
      console.warn('未找到匹配的任务数据', { baseline, experiment });
    }

    // 添加调试日志
    console.log('📊 Baseline Data:', {
      average_duration: baseline?.average_duration,
      A_class_avg_duration: baseline?.A_class_avg_duration,
      opening_hangup_rate: baseline?.opening_hangup_rate,
      silence_hangup_rate: baseline?.silence_hangup_rate
    });
    
    console.log('📊 Experiment Data:', {
      average_duration: experiment?.average_duration,
      A_class_avg_duration: experiment?.A_class_avg_duration,
      opening_hangup_rate: experiment?.opening_hangup_rate,
      silence_hangup_rate: experiment?.silence_hangup_rate
    });

    // 解析语料命中率
    const baselineHitRate = parseKeyCorpusHitRate(baseline?.key_corpus_hit_rate);
    const experimentHitRate = parseKeyCorpusHitRate(experiment?.key_corpus_hit_rate);

    // 解析语料挂机率 - 使用 key_corpus_hangup_rate_1 (根据实际API返回)
    const baselineHangupRate = parseKeyCorpusHitRate(baseline?.key_corpus_hangup_rate_1);
    const experimentHangupRate = parseKeyCorpusHitRate(experiment?.key_corpus_hangup_rate_1);

    // 解析知识库命中率
    const baselineKnowledgeRate = parseKeyCorpusHitRate(baseline?.key_knowledge_base_hit_rate);
    const experimentKnowledgeRate = parseKeyCorpusHitRate(experiment?.key_knowledge_base_hit_rate);

    // 解析意图命中率
    const baselineIntentionRate = parseKeyCorpusHitRate(baseline?.key_intention_hit_rate);
    const experimentIntentionRate = parseKeyCorpusHitRate(experiment?.key_intention_hit_rate);

    // 构建核心指标
    const coreMetrics: AnalyticsMetric[] = [
      {
        id: 'outbound_calls',
        label: '外呼量',
        baselineValue: formatNumber(baseline?.outbound_count),
        comparisonValue: formatNumber(experiment?.outbound_count),
        ...calculateDiff(baseline?.outbound_count || 0, experiment?.outbound_count || 0)
      },
      {
        id: 'connected_calls',
        label: '接通量',
        baselineValue: formatNumber(baseline?.pickup_count),
        comparisonValue: formatNumber(experiment?.pickup_count),
        ...calculateDiff(baseline?.pickup_count || 0, experiment?.pickup_count || 0)
      },
      {
        id: 'hangup_rate',
        label: '开场白挂机率',
        baselineValue: `${((baseline?.opening_hangup_rate || 0) * 100).toFixed(2)}%`,
        comparisonValue: `${((experiment?.opening_hangup_rate || 0) * 100).toFixed(2)}%`,
        diffValue: calculateAbsoluteDiff(
          (baseline?.opening_hangup_rate || 0) * 100,
          (experiment?.opening_hangup_rate || 0) * 100
        ) + '%',
        // 挂机率降低是好事，所以方向相反
        diffDirection: (experiment?.opening_hangup_rate || 0) < (baseline?.opening_hangup_rate || 0) ? 'up' : 
                       (experiment?.opening_hangup_rate || 0) > (baseline?.opening_hangup_rate || 0) ? 'down' : 'neutral'
      },
      {
        id: 'avg_duration',
        label: '平均通话时长',
        baselineValue: `${formatNumber(baseline?.average_duration, 2)}s`,
        comparisonValue: `${formatNumber(experiment?.average_duration, 2)}s`,
        diffValue: calculateAbsoluteDiff(baseline?.average_duration || 0, experiment?.average_duration || 0) + 's',
        diffDirection: (experiment?.average_duration || 0) > (baseline?.average_duration || 0) ? 'up' : 'down'
      },
      {
        id: 'class_a_duration',
        label: 'A类平均通话时长',
        baselineValue: `${formatNumber(baseline?.A_class_avg_duration, 2)}s`,
        comparisonValue: `${formatNumber(experiment?.A_class_avg_duration, 2)}s`,
        diffValue: calculateAbsoluteDiff(baseline?.A_class_avg_duration || 0, experiment?.A_class_avg_duration || 0) + 's',
        diffDirection: (experiment?.A_class_avg_duration || 0) > (baseline?.A_class_avg_duration || 0) ? 'up' : 'down'
      },
      {
        id: 'silence_hangup_rate',
        label: '沉默挂机率',
        baselineValue: `${((baseline?.silence_hangup_rate || 0) * 100).toFixed(2)}%`,
        comparisonValue: `${((experiment?.silence_hangup_rate || 0) * 100).toFixed(2)}%`,
        diffValue: calculateAbsoluteDiff(
          (baseline?.silence_hangup_rate || 0) * 100,
          (experiment?.silence_hangup_rate || 0) * 100
        ) + '%',
        // 沉默挂机率降低是好事，所以方向相反
        diffDirection: (experiment?.silence_hangup_rate || 0) < (baseline?.silence_hangup_rate || 0) ? 'up' : 
                       (experiment?.silence_hangup_rate || 0) > (baseline?.silence_hangup_rate || 0) ? 'down' : 'neutral'
      }
    ];

    // 定义重点语料的漏斗顺序
    const funnelOrder = [
      '问候语',
      '开场白',
      '引导打开信任度表',
      '引导展示公众号',
      '引导进入申请页面注册',
      '引导下载app',
      '引导报名'
    ];

    // 构建语料命中率指标（按漏斗顺序）
    const allKeys = Object.keys({ ...baselineHitRate, ...experimentHitRate }).filter(key => key !== '');
    
    // 将keys按照漏斗顺序排序，未在漏斗顺序中的key放在最后
    const sortedKeys = [
      ...funnelOrder.filter(key => allKeys.includes(key)),
      ...allKeys.filter(key => !funnelOrder.includes(key))
    ];

    const hitRateMetrics: AnalyticsMetric[] = sortedKeys.map((key, index) => {
      const baseVal = (baselineHitRate[key] || 0) * 100;
      const expVal = (experimentHitRate[key] || 0) * 100;
      
      // 计算纵向转化率（相对于上一个环节的转化率）
      let baseConversionRate = '';
      let expConversionRate = '';
      
      if (index === 0) {
        // 第一个环节显示 100%
        baseConversionRate = ' [100%]';
        expConversionRate = ' [100%]';
      } else if (index > 0) {
        const prevKey = sortedKeys[index - 1]!;
        const prevBaseVal = (baselineHitRate[prevKey] || 0) * 100;
        const prevExpVal = (experimentHitRate[prevKey] || 0) * 100;
        
        // 基准组：当前环节命中率 / 上一环节命中率
        if (prevBaseVal > 0) {
          const convRate = (baseVal / prevBaseVal * 100).toFixed(2);
          baseConversionRate = ` [${convRate}%]`;
        }
        
        // 实验组：当前环节命中率 / 上一环节命中率
        if (prevExpVal > 0) {
          const convRate = (expVal / prevExpVal * 100).toFixed(2);
          expConversionRate = ` [${convRate}%]`;
        }
      }
      
      return {
        id: `hit_${key}`,
        label: key,
        baselineValue: `${baseVal.toFixed(2)}%${baseConversionRate}`,
        comparisonValue: `${expVal.toFixed(2)}%${expConversionRate}`,
        diffValue: calculateAbsoluteDiff(baseVal, expVal) + '%',
        diffDirection: expVal > baseVal ? 'up' : expVal < baseVal ? 'down' : 'neutral'
      };
    });

    // 构建语料挂机率指标
    const hangupRateMetrics: AnalyticsMetric[] = Object.keys({ ...baselineHangupRate, ...experimentHangupRate })
      .filter(key => key !== '') // 过滤空key
      .map(key => {
        const baseVal = (baselineHangupRate[key] || 0) * 100;
        const expVal = (experimentHangupRate[key] || 0) * 100;
        return {
          id: `hangup_${key}`,
          label: key,
          baselineValue: `${baseVal.toFixed(2)}%`,
          comparisonValue: `${expVal.toFixed(2)}%`,
          diffValue: calculateAbsoluteDiff(baseVal, expVal) + '%',
          // 挂机率降低是好事
          diffDirection: expVal < baseVal ? 'up' : expVal > baseVal ? 'down' : 'neutral'
        };
      });

    // 构建知识库命中率指标
    const knowledgeRateMetrics: AnalyticsMetric[] = Object.keys({ ...baselineKnowledgeRate, ...experimentKnowledgeRate })
      .filter(key => key !== '') // 过滤空key
      .map(key => {
        const baseVal = (baselineKnowledgeRate[key] || 0) * 100;
        const expVal = (experimentKnowledgeRate[key] || 0) * 100;
        return {
          id: `knowledge_${key}`,
          label: key,
          baselineValue: `${baseVal.toFixed(2)}%`,
          comparisonValue: `${expVal.toFixed(2)}%`,
          diffValue: calculateAbsoluteDiff(baseVal, expVal) + '%',
          diffDirection: expVal > baseVal ? 'up' : expVal < baseVal ? 'down' : 'neutral'
        };
      });

    // 构建意图命中率指标
    const intentionRateMetrics: AnalyticsMetric[] = Object.keys({ ...baselineIntentionRate, ...experimentIntentionRate })
      .filter(key => key !== '') // 过滤空key
      .map(key => {
        const baseVal = (baselineIntentionRate[key] || 0) * 100;
        const expVal = (experimentIntentionRate[key] || 0) * 100;
        return {
          id: `intention_${key}`,
          label: key,
          baselineValue: `${baseVal.toFixed(2)}%`,
          comparisonValue: `${expVal.toFixed(2)}%`,
          diffValue: calculateAbsoluteDiff(baseVal, expVal) + '%',
          diffDirection: expVal > baseVal ? 'up' : expVal < baseVal ? 'down' : 'neutral'
        };
      });

    // 组装所有数据组
    const groups: AnalyticsGroup[] = [
      {
        id: 'core',
        title: 'A/B 测试核心数据',
        icon: 'BarChart',
        metrics: coreMetrics
      }
    ];

    // 如果有语料命中率数据，添加该组
    if (hitRateMetrics.length > 0) {
      groups.push({
        id: 'key_script_hit',
        title: '重点语料命中率详情',
        icon: 'Category',
        metrics: hitRateMetrics
      });
    }

    // 如果有语料挂机率数据，添加该组
    if (hangupRateMetrics.length > 0) {
      groups.push({
        id: 'key_script_hangup',
        title: '重点语料挂机率详情',
        icon: 'Category',
        metrics: hangupRateMetrics
      });
    }

    // 如果有知识库命中率数据，添加该组
    if (knowledgeRateMetrics.length > 0) {
      groups.push({
        id: 'knowledge_base_hit',
        title: '知识库命中率详情',
        icon: 'Category',
        metrics: knowledgeRateMetrics
      });
    }

    // 如果有意图命中率数据，添加该组
    if (intentionRateMetrics.length > 0) {
      groups.push({
        id: 'intention_hit',
        title: '意图命中率详情',
        icon: 'Category',
        metrics: intentionRateMetrics
      });
    }

    // 生成标题
    const formatTaskTitle = (tasks: string | string[]): string => {
      if (Array.isArray(tasks)) {
        if (tasks.length === 0) return '全部任务';
        if (tasks.length === 1) return tasks[0] || '全部任务';
        return `${tasks.length}个任务`;
      }
      return tasks || '全部任务';
    };

    return {
      groups,
      lastUpdated: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      baselineTitle: `${baselineScript} - ${formatTaskTitle(baselineTask)}`,
      comparisonTitle: `${experimentScript} - ${formatTaskTitle(experimentTask)}`
    };
  } catch (error) {
    console.error('获取分析数据失败:', error);
    throw error;
  }
}