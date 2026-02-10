// 完整数据流程测试
// 测试从API获取到数据转换的完整流程

const BASE_URL = 'http://192.168.23.176:3003';

async function getInfoByDate(date: string): Promise<string[]> {
  const url = `${BASE_URL}/getInfoByDate?date=${date}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return await response.json();
}

async function getInfoByScript(date: string, scriptName: string): Promise<any[]> {
  const url = `${BASE_URL}/getInfoByScript?date=${date}&script_name=${encodeURIComponent(scriptName)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return await response.json();
}

// 简化的数据转换函数（复制自api.ts）
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

function formatNumber(num: number | undefined, decimals: number = 0): string {
  if (num === undefined || num === null) return '--';
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

async function testFullFlow() {
  console.log('========== 完整数据流程测试 ==========\n');

  const testDate = '2026-02-09';

  try {
    // 步骤1: 获取可用脚本
    console.log('📌 步骤1: 获取可用脚本列表');
    const scripts = await getInfoByDate(testDate);
    console.log(`✅ 获取到 ${scripts.length} 个脚本\n`);

    if (scripts.length < 2) {
      console.log('❌ 脚本数量不足，无法进行A/B测试');
      return;
    }

    // 步骤2: 选择两个脚本进行对比
    const baselineScript = scripts[0]!;
    const experimentScript = scripts[1]!;

    console.log(`📌 步骤2: 选择对比脚本`);
    console.log(`   基准脚本 (A): ${baselineScript}`);
    console.log(`   实验脚本 (B): ${experimentScript}\n`);

    // 步骤3: 获取基准脚本的任务数据
    console.log('📌 步骤3: 获取基准脚本数据');
    const baselineData = await getInfoByScript(testDate, baselineScript);
    console.log(`✅ 获取到 ${baselineData.length} 条任务数据`);
    
    if (baselineData.length === 0) {
      console.log('❌ 基准脚本无任务数据');
      return;
    }

    const baselineTask = baselineData[0];
    console.log(`   选择任务: ${baselineTask.task_name}\n`);

    // 步骤4: 获取实验脚本的任务数据
    console.log('📌 步骤4: 获取实验脚本数据');
    const experimentData = await getInfoByScript(testDate, experimentScript);
    console.log(`✅ 获取到 ${experimentData.length} 条任务数据`);
    
    if (experimentData.length === 0) {
      console.log('❌ 实验脚本无任务数据');
      return;
    }

    const experimentTask = experimentData[0];
    console.log(`   选择任务: ${experimentTask.task_name}\n`);

    // 步骤5: 数据对比分析
    console.log('📌 步骤5: 数据对比分析');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('核心指标对比:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // 外呼量
    const baseOutbound = baselineTask.outbound_count || 0;
    const expOutbound = experimentTask.outbound_count || 0;
    console.log(`外呼量:           ${formatNumber(baseOutbound)} → ${formatNumber(expOutbound)} (${expOutbound - baseOutbound >= 0 ? '+' : ''}${formatNumber(expOutbound - baseOutbound)})`);

    // 接通量
    const basePickup = baselineTask.pickup_count || 0;
    const expPickup = experimentTask.pickup_count || 0;
    console.log(`接通量:           ${formatNumber(basePickup)} → ${formatNumber(expPickup)} (${expPickup - basePickup >= 0 ? '+' : ''}${formatNumber(expPickup - basePickup)})`);

    // 开场白挂机率
    const baseHangup = (baselineTask.opening_hangup_rate || 0) * 100;
    const expHangup = (experimentTask.opening_hangup_rate || 0) * 100;
    const hangupDiff = expHangup - baseHangup;
    console.log(`开场白挂机率:     ${baseHangup.toFixed(2)}% → ${expHangup.toFixed(2)}% (${hangupDiff >= 0 ? '+' : ''}${hangupDiff.toFixed(2)}%)`);

    // 平均通话时长
    const baseDuration = baselineTask.average_duration || 0;
    const expDuration = experimentTask.average_duration || 0;
    const durationDiff = expDuration - baseDuration;
    console.log(`平均通话时长:     ${baseDuration.toFixed(2)}s → ${expDuration.toFixed(2)}s (${durationDiff >= 0 ? '+' : ''}${durationDiff.toFixed(2)}s)`);

    // A类平均通话时长
    const baseADuration = baselineTask.A_class_avg_duration || 0;
    const expADuration = experimentTask.A_class_avg_duration || 0;
    const aDurationDiff = expADuration - baseADuration;
    console.log(`A类平均通话时长:  ${baseADuration.toFixed(2)}s → ${expADuration.toFixed(2)}s (${aDurationDiff >= 0 ? '+' : ''}${aDurationDiff.toFixed(2)}s)`);

    // 沉默挂机率
    const baseSilence = (baselineTask.silence_hangup_rate || 0) * 100;
    const expSilence = (experimentTask.silence_hangup_rate || 0) * 100;
    const silenceDiff = expSilence - baseSilence;
    console.log(`沉默挂机率:       ${baseSilence.toFixed(2)}% → ${expSilence.toFixed(2)}% (${silenceDiff >= 0 ? '+' : ''}${silenceDiff.toFixed(2)}%)`);

    // 步骤6: 语料命中率分析
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('语料命中率对比:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const baselineHitRate = parseKeyCorpusHitRate(baselineTask.key_corpus_hit_rate);
    const experimentHitRate = parseKeyCorpusHitRate(experimentTask.key_corpus_hit_rate);
    
    const allKeys = new Set([...Object.keys(baselineHitRate), ...Object.keys(experimentHitRate)]);
    Array.from(allKeys).slice(0, 5).forEach(key => {
      const baseVal = (baselineHitRate[key] || 0) * 100;
      const expVal = (experimentHitRate[key] || 0) * 100;
      const diff = expVal - baseVal;
      console.log(`${key.padEnd(20)} ${baseVal.toFixed(2)}% → ${expVal.toFixed(2)}% (${diff >= 0 ? '+' : ''}${diff.toFixed(2)}%)`);
    });

    // 步骤7: 语料挂机率分析
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('语料挂机率对比:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const baselineHangupRate = parseKeyCorpusHitRate(baselineTask.key_corpus_hangup_rate_1);
    const experimentHangupRate = parseKeyCorpusHitRate(experimentTask.key_corpus_hangup_rate_1);
    
    const allHangupKeys = new Set([...Object.keys(baselineHangupRate), ...Object.keys(experimentHangupRate)]);
    Array.from(allHangupKeys).slice(0, 5).forEach(key => {
      const baseVal = (baselineHangupRate[key] || 0) * 100;
      const expVal = (experimentHangupRate[key] || 0) * 100;
      const diff = expVal - baseVal;
      console.log(`${key.padEnd(20)} ${baseVal.toFixed(2)}% → ${expVal.toFixed(2)}% (${diff >= 0 ? '+' : ''}${diff.toFixed(2)}%)`);
    });

    console.log('\n✅ 完整数据流程测试成功！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 执行测试
testFullFlow();
