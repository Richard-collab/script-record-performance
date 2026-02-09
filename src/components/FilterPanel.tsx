import React, { useEffect, useState } from 'react';
import { Box, Typography, MenuItem, Button, Select, Divider, Switch, FormControlLabel, Tooltip, Checkbox, ListItemText, type SelectChangeEvent } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import SearchIcon from '@mui/icons-material/Search';
import dayjs, { type Dayjs } from 'dayjs';
import type { FilterParams } from '../types/analytics';
import { getInfoByDate, getInfoByScript } from '../utils/api';
import { formatScriptName, formatTaskName } from '../utils/formatters';

interface FilterPanelProps {
    /** 
     * 点击“开始分析”按钮时的回调函数
     * @param filters 包含日期范围、基准组和实验组信息的筛选参数 
     */
    onSearch: (filters: FilterParams) => void;
}

/**
 * 筛选面板组件 (FilterPanel)
 * 
 * 左侧侧边栏，用于配置 A/B 测试的对比参数。
 * 主要功能：
 * 1. 选择分析的时间周期
 * 2. 选择基准组 (Control Group) 的话术脚本和具体任务
 * 3. 选择实验组 (Experiment Group) 的话术脚本和具体任务
 * 4. 支持根据日期自动加载可用脚本，根据脚本自动加载可用任务
 */
const FilterPanel: React.FC<FilterPanelProps> = ({ onSearch }) => {
    // ==========================================
    // 状态管理 (State Management)
    // ==========================================

    // 日期范围状态：默认为今天
    const [startDate, setStartDate] = useState<Dayjs | null>(dayjs());
    const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());

    // 脚本列表：根据所选日期动态加载
    const [availableScripts, setAvailableScripts] = useState<string[]>([]);
    
    // --- 基准组 (Control) 状态 ---
    const [baselineScript, setBaselineScript] = useState(''); // 选中的基准脚本
    const [baselineTask, setBaselineTask] = useState<string[]>([]);     // 选中的基准任务ID（支持多选）
    const [baselineTaskOptions, setBaselineTaskOptions] = useState<string[]>([]); // 基准任务下拉选项

    // --- 实验组 (Experiment) 状态 ---
    const [experimentScript, setExperimentScript] = useState(''); // 选中的实验脚本
    const [experimentTask, setExperimentTask] = useState<string[]>([]);     // 选中的实验任务ID（支持多选）
    const [experimentTaskOptions, setExperimentTaskOptions] = useState<string[]>([]); // 实验任务下拉选项

    const [showStats, setShowStats] = useState(true); // 是否显示数据统计开关

    // ==========================================
    // 副作用与数据获取 (Effects & Data Fetching)
    // ==========================================

    /**
     * 1. 当开始日期 (startDate) 变化时，获取该日期的可用脚本列表
     *    重置所有后续的选择（脚本、任务）
     */
    useEffect(() => {
        const fetchScripts = async () => {
            if (startDate) {
                const dateStr = startDate.format('YYYY-MM-DD');
                try {
                    const scripts = await getInfoByDate(dateStr);
                    setAvailableScripts(scripts || []);
                    // 重置重置状态，防止数据不一致
                    setBaselineScript('');
                    setExperimentScript('');
                    setBaselineTask([]);
                    setExperimentTask([]);
                } catch (err) {
                    console.error("Failed to fetch scripts", err);
                    setAvailableScripts([]);
                }
            }
        };
        fetchScripts();
    }, [startDate]);

    /**
     * 2. 当基准组脚本 (baselineScript) 变化时，获取该脚本下的任务列表
     *    并自动选中第一个任务
     */
    useEffect(() => {
        const fetchBaselineTasks = async () => {
            if (baselineScript && startDate) {
                // Clear state immediately to provide feedback
                setBaselineTaskOptions([]);
                setBaselineTask([]);

                const dateStr = startDate.format('YYYY-MM-DD');
                try {
                    console.log(`Fetching baseline tasks for script: ${baselineScript}, date: ${dateStr}`);
                    const data = await getInfoByScript(dateStr, baselineScript);
                    console.log("Baseline tasks response:", data);

                    // 提取唯一的任务名称并过滤空值
                    const tasks = Array.from(new Set(data.map(item => item.task_name || ''))).filter(Boolean);
                    setBaselineTaskOptions(tasks);
                    
                    // 默认不选择任何任务（空数组表示全部）
                    setBaselineTask([]);
                } catch (err) {
                    console.error("Failed to fetch baseline tasks", err);
                    setBaselineTaskOptions([]);
                }
            } else {
                setBaselineTaskOptions([]);
                setBaselineTask([]);
            }
        };
        fetchBaselineTasks();
    }, [baselineScript, startDate]);

    /**
     * 3. 当实验组脚本 (experimentScript) 变化时，获取该脚本下的任务列表
     *    并自动选中第一个任务
     */
    useEffect(() => {
        const fetchExperimentTasks = async () => {
             if (experimentScript && startDate) {
                // Clear state immediately
                setExperimentTaskOptions([]);
                setExperimentTask([]);

                const dateStr = startDate.format('YYYY-MM-DD');
                try {
                    console.log(`Fetching experiment tasks for script: ${experimentScript}, date: ${dateStr}`);
                    const data = await getInfoByScript(dateStr, experimentScript);
                    console.log("Experiment tasks response:", data);

                    const tasks = Array.from(new Set(data.map(item => item.task_name || ''))).filter(Boolean);
                    setExperimentTaskOptions(tasks);
                    // 默认不选择任何任务（空数组表示全部）
                    setExperimentTask([]);
                } catch (err) {
                    console.error("Failed to fetch experiment tasks", err);
                    setExperimentTaskOptions([]);
                }
            } else {
                 setExperimentTaskOptions([]);
                 setExperimentTask([]);
            }
        };
        fetchExperimentTasks();
    }, [experimentScript, startDate]);


    /**
     * 触发搜索/分析操作
     * 将当前面板的所有筛选状态打包传递给父组件
     */
    const handleSearch = () => {
        onSearch({
            dateRange: [
                startDate ? startDate.toDate() : null, 
                endDate ? endDate.toDate() : null
            ],
            baselineScript,
            baselineTask,
            experimentScript,
            experimentTask
        });
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{
                width: 320,
                borderRight: '1px solid #e0e0e0',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                height: '100%',
                overflowY: 'auto',
                bgcolor: 'background.paper'
            }}>
                {/* Date Range Section */}
                <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        分析周期
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" gutterBottom>
                        时间范围
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                         {/* Simplified Date Range Display/Picker for now */}
                         <DatePicker
                            value={startDate}
                            onChange={(newValue) => setStartDate(newValue)}
                            slotProps={{ textField: { size: 'small' } }}
                         />
                         <Typography>-</Typography>
                         <DatePicker
                            value={endDate}
                            onChange={(newValue) => setEndDate(newValue)}
                            slotProps={{ textField: { size: 'small' } }}
                         />
                    </Box>
                </Box>

                <Divider />

                {/* Control Group */}
                <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        基准组 (CONTROL)
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" gutterBottom>
                        基准话术 (A)
                    </Typography>
                    <Select
                        fullWidth
                        size="small"
                        value={baselineScript}
                        onChange={(e) => setBaselineScript(e.target.value)}
                        sx={{ mb: 2 }}
                        displayEmpty
                    >
                        <MenuItem value="" disabled>请选择基准话术</MenuItem>
                        {availableScripts.map((script) => (
                            <MenuItem key={script} value={script}>
                                <Tooltip title={script} placement="right">
                                    <span>{formatScriptName(script)}</span>
                                </Tooltip>
                            </MenuItem>
                        ))}
                    </Select>

                    <Typography variant="body2" fontWeight="bold" gutterBottom>
                        任务 ID（可多选）
                    </Typography>
                    <Select
                        fullWidth
                        size="small"
                        multiple
                        value={baselineTask}
                        onChange={(e) => setBaselineTask(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                        disabled={!baselineScript}
                        displayEmpty
                        renderValue={(selected) => {
                            if (selected.length === 0) {
                                return <em>全部任务</em>;
                            }
                            return selected.map(s => formatTaskName(s)).join(', ');
                        }}
                    >
                        {baselineTaskOptions.map((task) => (
                             <MenuItem key={task} value={task} title={task}>
                                <Checkbox checked={baselineTask.indexOf(task) > -1} />
                                <ListItemText primary={formatTaskName(task)} />
                            </MenuItem>
                        ))}
                    </Select>
                </Box>

                <Box sx={{ textAlign: 'center', color: '#bdbdbd', fontSize: '12px' }}>
                    ------- VS -------
                </Box>

                {/* Experiment Group */}
                <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        实验组 (EXPERIMENT)
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" gutterBottom>
                        对比话术 (B)
                    </Typography>
                     <Select
                        fullWidth
                        size="small"
                        value={experimentScript}
                        onChange={(e) => setExperimentScript(e.target.value)}
                        sx={{ mb: 2 }}
                        displayEmpty
                    >
                        <MenuItem value="" disabled>请选择对比话术</MenuItem>
                        {availableScripts.map((script) => (
                            <MenuItem key={script} value={script}>
                                 <Tooltip title={script} placement="right">
                                    <span>{formatScriptName(script)}</span>
                                </Tooltip>
                            </MenuItem>
                        ))}
                    </Select>

                    <Typography variant="body2" fontWeight="bold" gutterBottom>
                        任务 ID（可多选）
                    </Typography>
                    <Select
                        fullWidth
                        size="small"
                        multiple
                        value={experimentTask}
                        onChange={(e) => setExperimentTask(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                         disabled={!experimentScript}
                        displayEmpty
                        renderValue={(selected) => {
                            if (selected.length === 0) {
                                return <em>全部任务</em>;
                            }
                            return selected.map(s => formatTaskName(s)).join(', ');
                        }}
                    >
                        {experimentTaskOptions.map((task) => (
                            <MenuItem key={task} value={task} title={task}>
                                <Checkbox checked={experimentTask.indexOf(task) > -1} />
                                <ListItemText primary={formatTaskName(task)} />
                            </MenuItem>
                        ))}
                    </Select>
                </Box>

                <FormControlLabel
                    control={<Switch checked={showStats} onChange={(e) => setShowStats(e.target.checked)} />}
                    label="显示数据统计"
                    sx={{ mt: 'auto' }}
                />

                <Box>
                    <Button
                        variant="contained"
                        fullWidth
                        startIcon={<SearchIcon />}
                        onClick={handleSearch}
                        sx={{ mb: 1, borderRadius: 2 }}
                    >
                        开始分析
                    </Button>
                    <Button variant="text" fullWidth size="small">
                        重置筛选
                    </Button>
                </Box>
            </Box>
        </LocalizationProvider>
    );
};

export default FilterPanel;
