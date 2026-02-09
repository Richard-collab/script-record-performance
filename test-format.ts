// 测试格式化函数
function formatNumber(num: number | undefined, decimals: number = 0): string {
  console.log('Input:', num, 'Type:', typeof num, 'isNaN:', isNaN(num as number));
  if (num === undefined || num === null || isNaN(num)) return '--';
  const result = num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  console.log('Output:', result);
  return result;
}

// 测试数据
const testData = {
  average_duration: 18.29069646430954,
  A_class_avg_duration: 229.5186176470588
};

console.log('\n测试 average_duration:');
const avgResult = formatNumber(testData.average_duration, 2);
console.log('Result:', avgResult);
console.log('With s:', `${avgResult}s`);

console.log('\n测试 A_class_avg_duration:');
const aClassResult = formatNumber(testData.A_class_avg_duration, 2);
console.log('Result:', aClassResult);
console.log('With s:', `${aClassResult}s`);

console.log('\n测试 undefined:');
const undefinedResult = formatNumber(undefined, 2);
console.log('Result:', undefinedResult);

console.log('\n测试 0:');
const zeroResult = formatNumber(0, 2);
console.log('Result:', zeroResult);
