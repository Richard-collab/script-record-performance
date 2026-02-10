// API测试脚本
// 直接调用后端API，不通过vite代理

const BASE_URL = 'http://192.168.23.176:3003';

async function getInfoByDate(date: string): Promise<string[]> {
  const url = `${BASE_URL}/getInfoByDate?date=${date}`;
  console.log(`🚀 Requesting: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  return await response.json();
}

async function getInfoByScript(date: string, scriptName: string): Promise<any[]> {
  const url = `${BASE_URL}/getInfoByScript?date=${date}&script_name=${encodeURIComponent(scriptName)}`;
  console.log(`🚀 Requesting: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  return await response.json();
}

async function testAPI() {
  console.log('========== API 测试开始 ==========\n');

  const testDate = '2026-02-09';
  
  try {
    // 1. 测试获取日期对应的脚本列表
    console.log('1️⃣ 测试 getInfoByDate - 获取脚本列表');
    console.log(`   日期: ${testDate}`);
    const scripts = await getInfoByDate(testDate);
    console.log(`   ✅ 获取到 ${scripts.length} 个脚本\n`);
    
    if (scripts.length > 0) {
      console.log('   前3个脚本:');
      scripts.slice(0, 3).forEach((script, idx) => {
        console.log(`   ${idx + 1}. ${script}`);
      });
      console.log('');

      // 2. 测试获取第一个脚本的详细数据
      const testScript = scripts[0];
      if (!testScript) throw new Error("No script found");

      console.log(`2️⃣ 测试 getInfoByScript - 获取脚本详情`);
      console.log(`   脚本名称: ${testScript}`);
      
      const scriptData = await getInfoByScript(testDate, testScript);
      console.log(`   ✅ 获取到 ${scriptData.length} 条记录\n`);

      if (scriptData.length > 0) {
        console.log('   第一条数据的字段:');
        const firstRecord = scriptData[0];
        Object.keys(firstRecord).forEach(key => {
          const value = firstRecord[key];
          const displayValue = typeof value === 'string' && value.length > 100 
            ? value.substring(0, 100) + '...' 
            : value;
          console.log(`   - ${key}: ${displayValue}`);
        });

        console.log('\n   📊 数据统计:');
        console.log(`   - 外呼量: ${firstRecord.outbound_count}`);
        console.log(`   - 接通量: ${firstRecord.pickup_count}`);
        console.log(`   - 开场白挂机率: ${(firstRecord.opening_hangup_rate * 100).toFixed(2)}%`);
        console.log(`   - 平均通话时长: ${firstRecord.average_duration}s`);
        console.log(`   - key_corpus_hit_rate: ${firstRecord.key_corpus_hit_rate}`);
        console.log(`   - key_corpus_hangup_rate: ${firstRecord.key_corpus_hangup_rate}`);
      }

      // 3. 如果有多个脚本，测试对比
      if (scripts.length > 1) {
        console.log(`\n3️⃣ 测试多脚本对比`);
        const testScript2 = scripts[1];
        if (testScript2) {
          console.log(`   对比脚本: ${testScript2}`);

          const scriptData2 = await getInfoByScript(testDate, testScript2);
          if (scriptData2.length > 0) {
            console.log(`   ✅ 获取到 ${scriptData2.length} 条记录`);
            console.log(`   - 外呼量: ${scriptData2[0].outbound_count}`);
            console.log(`   - 接通量: ${scriptData2[0].pickup_count}`);
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }

  console.log('\n========== API 测试结束 ==========');
}

// 执行测试
testAPI();
