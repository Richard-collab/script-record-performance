import { URLSearchParams } from 'url'; 
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
interface ScriptTaskData {
  script_name?: string;
  task_name?: string;
  dt?: string;
  [key: string]: any; // 允许其他动态字段
}

interface HealthResponse {
  status: string;
  db_path: string;
}

// ==========================================
// 配置 (Configuration)
// ==========================================

const BASE_URL = "http://192.168.23.176:3003";

// ==========================================
// 工具函数 (Utils)
// ==========================================

/**
 * 发送请求并解析 JSON 的通用封装
 * * @param endpoint - API 路径 (例如 '/search')
 * @param params - URL查询参数对象
 * @returns 解析后的 JSON 数据
 * @throws {Error} 当 HTTP 状态码不是 2xx 时抛出异常
 */
async function fetchClient<T>(endpoint: string, params?: URLSearchParams): Promise<T> {
  const url = new URL(endpoint, BASE_URL);
  
  if (params) {
    url.search = params.toString();
  }

  console.log(`\n🚀 Requesting: ${url.toString()}`);

  try {
    const response = await fetch(url.toString());

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
async function checkHealth(): Promise<boolean> {
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
async function searchData(
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
async function getInfoByDate(date: string, scriptName?: string): Promise<void> {
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
  } catch (error) {
    // 错误处理
  }
}

/**
 * 根据脚本列表获取详细信息
 * GET /getInfoByScript
 * * @param date - 查询日期 (YYYY-MM-DD)
 * @param scriptNames - 脚本名称 (单个字符串或字符串数组)
 */
async function getInfoByScript(date: string, scriptNames: string | string[]): Promise<void> {
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
  } catch (error) {
    // 错误处理
  }
}

// ==========================================
// 主执行入口 (Main Execution)
// ==========================================

(async () => {
  console.log("=== API Test Runner Started ===");

  // 1. 健康检查
  // await checkHealth();

  // 2. 测试根据日期查询
  // 注意：修改为你数据库中实际存在的日期
  await getInfoByDate("2026-02-09");

  // 3. 测试根据脚本查询 (支持数组)
  const testScriptList = [
    "1组众安贷公众号-众安贷钱包AI拉新-C1.0yd",
    "1组众安贷公众号-众安贷钱包AI拉新-C1.1yd#变量版本"
  ]
  await getInfoByScript("2026-02-09", testScriptList); 

  // 4. 测试通用搜索
  /*
  await searchData(
    "2023-01-01",
    "2023-12-31",
    "测试脚本名称"
  );
  */
  
  console.log("\n=== Test Finished ===");
})();