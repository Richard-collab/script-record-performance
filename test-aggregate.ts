// 测试聚合函数对"未找到对应数据"的处理
const testData = [
    {
        "task_name": "任务1",
        "outbound_count": 68811,
        "pickup_count": 3046,
        "opening_hangup_rate": 0.6852300242130751,
        "average_duration": 19.18404531304047,
        "silence_hangup_rate": 0.08163265306122448,
        "A_class_avg_duration": 276.3022222222222
    },
    {
        "task_name": "任务2",
        "outbound_count": 877652,
        "pickup_count": 46569,
        "opening_hangup_rate": "未找到对应数据",
        "average_duration": "未找到对应数据",
        "silence_hangup_rate": "未找到对应数据",
        "A_class_avg_duration": "未找到对应数据"
    },
    {
        "task_name": "任务3",
        "outbound_count": 932689,
        "pickup_count": 57295,
        "opening_hangup_rate": "未找到对应数据",
        "average_duration": "未找到对应数据",
        "silence_hangup_rate": "未找到对应数据",
        "A_class_avg_duration": "未找到对应数据"
    }
];

// 模拟聚合逻辑
let totalOutbound = 0;
let totalPickup = 0;
let totalValidPickupForDuration = 0;
let weightedDuration = 0;
let weightedAClassDuration = 0;

testData.forEach(task => {
    const outboundCount = typeof task.outbound_count === 'number' ? task.outbound_count : 0;
    const pickupCount = typeof task.pickup_count === 'number' ? task.pickup_count : 0;
    
    totalOutbound += outboundCount;
    totalPickup += pickupCount;
    
    const avgDuration = typeof task.average_duration === 'number' ? task.average_duration : 0;
    const aClassDuration = typeof task.A_class_avg_duration === 'number' ? task.A_class_avg_duration : 0;
    
    console.log(`任务: ${task.task_name}`);
    console.log(`  pickup_count: ${pickupCount}`);
    console.log(`  average_duration: ${avgDuration} (类型: ${typeof task.average_duration})`);
    console.log(`  A_class_avg_duration: ${aClassDuration} (类型: ${typeof task.A_class_avg_duration})`);
    
    if (pickupCount > 0 && avgDuration > 0) {
        totalValidPickupForDuration += pickupCount;
        weightedDuration += avgDuration * pickupCount;
        weightedAClassDuration += aClassDuration * pickupCount;
        console.log(`  ✅ 有效数据已计入`);
    } else {
        console.log(`  ⚠️ 无效数据已跳过`);
    }
    console.log('');
});

console.log('=== 聚合结果 ===');
console.log(`总外呼量: ${totalOutbound.toLocaleString()}`);
console.log(`总接通量: ${totalPickup.toLocaleString()}`);
console.log(`有效接通量（用于时长计算）: ${totalValidPickupForDuration.toLocaleString()}`);

const finalAvgDuration = totalValidPickupForDuration > 0 ? weightedDuration / totalValidPickupForDuration : 0;
const finalAClassDuration = totalValidPickupForDuration > 0 ? weightedAClassDuration / totalValidPickupForDuration : 0;

console.log(`平均通话时长: ${finalAvgDuration.toFixed(2)}s`);
console.log(`A类平均通话时长: ${finalAClassDuration.toFixed(2)}s`);
console.log(`是否有NaN: average_duration=${isNaN(finalAvgDuration)}, A_class=${isNaN(finalAClassDuration)}`);
