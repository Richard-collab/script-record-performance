import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Button, Divider, Switch, FormControlLabel, Checkbox, ListItemText, TextField, Autocomplete } from '@mui/material';
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
    /**
     * 初始筛选参数，用于URL参数回显
     */
    initialFilters?: Partial<FilterParams>;
    /**
     * 切换显示话术差异时的回调函数
     */
    onShowDiffChange?: (show: boolean) => void;
}

/**
 * 筛选面板组件 (FilterPanel)
 */
const FilterPanel: React.FC<FilterPanelProps> = ({ onSearch, initialFilters, onShowDiffChange }) => {
    // ==========================================
    // 状态管理 (State Management)
    // ==========================================
    
    const initialStartDate = initialFilters?.dateRange?.[0] ? dayjs(initialFilters.dateRange[0]) : dayjs();
    const initialEndDate = initialFilters?.dateRange?.[1] ? dayjs(initialFilters.dateRange[1]) : dayjs();

    // 日期范围状态：默认为今天 或 初始值
    const [startDate, setStartDate] = useState<Dayjs | null>(initialStartDate);
    const [endDate, setEndDate] = useState<Dayjs | null>(initialEndDate);

    // 脚本列表：根据所选日期动态加载
    const [availableScripts, setAvailableScripts] = useState<string[]>([]);
    
    // --- 基准组 (Control) 状态 ---
    const [baselineScript, setBaselineScript] = useState(initialFilters?.baselineScript || ''); // 选中的基准脚本
    const [baselineTask, setBaselineTask] = useState<string[]>(Array.isArray(initialFilters?.baselineTask) 
        ? initialFilters.baselineTask 
        : (initialFilters?.baselineTask ? [initialFilters.baselineTask] : []));     // 选中的基准任务ID（支持多选）
    const [baselineTaskOptions, setBaselineTaskOptions] = useState<string[]>([]); // 基准任务下拉选项

    // --- 实验组 (Experiment) 状态 ---
    const [experimentScript, setExperimentScript] = useState(initialFilters?.experimentScript || ''); // 选中的实验脚本
    const [experimentTask, setExperimentTask] = useState<string[]>(Array.isArray(initialFilters?.experimentTask) 
        ? initialFilters.experimentTask 
        : (initialFilters?.experimentTask ? [initialFilters.experimentTask] : []));     // 选中的实验任务ID（支持多选）
    const [experimentTaskOptions, setExperimentTaskOptions] = useState<string[]>([]); // 实验任务下拉选项

    const [showStats, setShowStats] = useState(true); // 是否显示数据统计开关
    const [showScriptDiff, setShowScriptDiff] = useState(false); // 是否显示话术差异开关

    const normalizeOption = (value: string) => value.toLowerCase();

    // 标记是否是首次加载（挂载）
    const isFirstRun = useRef(true);

    // Turn off isFirstRun after mount cycle
    useEffect(() => {
        // Keep it true for the duration of the very first effects? 
        // No, standard practice is set to false in effect.
        isFirstRun.current = false;
        console.log('FilterPanel mounted', { initialFilters, bs: initialFilters?.baselineScript });
    }, []);

    // 监听 props 变化并更新状态 (Fail-safe mechanism)
    // 如果 key 机制失效或者 initialFilters 异步到达，这里可以补救
    useEffect(() => {
        if (initialFilters) {
            console.log('FilterPanel received updated initialFilters', initialFilters);
            if (initialFilters.dateRange?.[0]) setStartDate(dayjs(initialFilters.dateRange[0]));
            if (initialFilters.dateRange?.[1]) setEndDate(dayjs(initialFilters.dateRange[1]));
            if (initialFilters.baselineScript) setBaselineScript(initialFilters.baselineScript);
            if (initialFilters.experimentScript) setExperimentScript(initialFilters.experimentScript);
            if (initialFilters.baselineTask) {
                setBaselineTask(Array.isArray(initialFilters.baselineTask) ? initialFilters.baselineTask : [initialFilters.baselineTask]);
            }
            if (initialFilters.experimentTask) {
                setExperimentTask(Array.isArray(initialFilters.experimentTask) ? initialFilters.experimentTask : [initialFilters.experimentTask]);
            }
        }
    }, [initialFilters]); // Careful: if objectref changes but values same. 

    // 监听 showScriptDiff 变化并通知父组件
    useEffect(() => {
        if (onShowDiffChange) {
            onShowDiffChange(showScriptDiff);
        }
    }, [showScriptDiff, onShowDiffChange]);


    // ==========================================
    // 副作用与数据获取 (Effects & Data Fetching)
    // ==========================================

    /**
     * 1. 当开始日期 (startDate) 变化时，获取该日期的可用脚本列表
     *    重置所有后续的选择（脚本、任务）
     */
    useEffect(() => {
        const isMounting = isFirstRun.current;

        const fetchScripts = async () => {
            if (startDate) {
                const dateStr = startDate.format('YYYY-MM-DD');
                try {
                    const scripts = await getInfoByDate(dateStr);
                    setAvailableScripts(scripts || []);
                    
                    // 仅在非初始化阶段清除
                    if (!isMounting && !initialFilters?.baselineScript) {
                        setBaselineScript('');
                        setExperimentScript('');
                        setBaselineTask([]);
                        setExperimentTask([]);
                    }
                } catch (err) {
                    console.error("Failed to fetch scripts", err);
                    setAvailableScripts([]);
                }
            }
        };
        fetchScripts();
    }, [startDate]); // initialFilters is not dep, but we check ref logic

    /**
     * 2. 当基准组脚本 (baselineScript) 变化时，获取该脚本下的任务列表
     *    并自动选中第一个任务
     */
    useEffect(() => {
        const isMounting = isFirstRun.current;

        const fetchBaselineTasks = async () => {
            if (baselineScript && startDate) {
                if (!isMounting && !initialFilters?.baselineTask) {
                     setBaselineTask([]);
                }

                const dateStr = startDate.format('YYYY-MM-DD');
                try {
                    console.log(`Fetching baseline tasks for script: ${baselineScript}, date: ${dateStr}`);
                    const data = await getInfoByScript(dateStr, baselineScript);
                    
                    // 提取唯一的任务名称并过滤空值
                    const tasks = Array.from(new Set(data.map(item => item.task_name || ''))).filter(Boolean);
                    setBaselineTaskOptions(tasks);
                    
                    // 仅在非初始化阶段重置
                    if (!isMounting && !initialFilters?.baselineTask) {
                        setBaselineTask([]);
                    }
                } catch (err) {
                    console.error("Failed to fetch baseline tasks", err);
                    setBaselineTaskOptions([]);
                }
            } else {
                if (!isMounting) {
                    setBaselineTaskOptions([]);
                    setBaselineTask([]);
                }
            }
        };
        fetchBaselineTasks();
    }, [baselineScript, startDate]);

    /**
     * 3. 当实验组脚本 (experimentScript) 变化时，获取该脚本下的任务列表
     *    并自动选中第一个任务
     */
    useEffect(() => {
        const isMounting = isFirstRun.current;

        const fetchExperimentTasks = async () => {
             if (experimentScript && startDate) {
                if (!isMounting && !initialFilters?.experimentScript) {
                    setExperimentTask([]);
                }

                const dateStr = startDate.format('YYYY-MM-DD');
                try {
                    console.log(`Fetching experiment tasks for script: ${experimentScript}, date: ${dateStr}`);
                    const data = await getInfoByScript(dateStr, experimentScript);
                    
                    const tasks = Array.from(new Set(data.map(item => item.task_name || ''))).filter(Boolean);
                    setExperimentTaskOptions(tasks);
                    
                    // 仅在非初始化阶段重置
                    if (!isMounting && !initialFilters?.experimentScript) {
                         setExperimentTask([]);
                    }
                } catch (err) {
                    console.error("Failed to fetch experiment tasks", err);
                    setExperimentTaskOptions([]);
                }
            } else {
                 if (!isMounting) {
                     setExperimentTaskOptions([]);
                     setExperimentTask([]);
                 }
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
                flexShrink: 0,
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
                    <Autocomplete
                        options={availableScripts}
                        value={baselineScript || null}
                        onChange={(_, value) => setBaselineScript(value ?? '')}
                        size="small"
                        sx={{ mb: 2 }}
                        getOptionLabel={(option) => formatScriptName(option)}
                        isOptionEqualToValue={(option, value) => option === value}
                        renderOption={(props, option) => (
                            <li {...props} title={option}>
                                {formatScriptName(option)}
                            </li>
                        )}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder="选择或搜索话术"
                            />
                        )}
                    />

                    <Typography variant="body2" fontWeight="bold" gutterBottom>
                        任务 ID（可多选）
                    </Typography>
                    <Autocomplete
                        multiple
                        options={baselineTaskOptions}
                        value={baselineTask}
                        onChange={(_, value) => setBaselineTask(value)}
                        size="small"
                        disabled={!baselineScript}
                        disableCloseOnSelect
                        limitTags={1}
                        getOptionLabel={(option) => formatTaskName(option)}
                        isOptionEqualToValue={(option, value) => option === value}
                        renderOption={(props, option, { selected }) => (
                            <li {...props} title={option}>
                                <Checkbox size="small" checked={selected} />
                                <ListItemText primary={formatTaskName(option)} />
                            </li>
                        )}
                        filterOptions={(options, state) =>
                            options.filter((option) => normalizeOption(option).includes(state.inputValue.toLowerCase()))
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder={baselineTask.length === 0 ? '默认全部任务' : '搜索任务'}
                            />
                        )}
                    />
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
                     <Autocomplete
                        options={availableScripts}
                        value={experimentScript || null}
                        onChange={(_, value) => setExperimentScript(value ?? '')}
                        size="small"
                        sx={{ mb: 2 }}
                        getOptionLabel={(option) => formatScriptName(option)}
                        isOptionEqualToValue={(option, value) => option === value}
                        renderOption={(props, option) => (
                            <li {...props} title={option}>
                                {formatScriptName(option)}
                            </li>
                        )}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder="选择或搜索话术"
                            />
                        )}
                    />

                    <Typography variant="body2" fontWeight="bold" gutterBottom>
                        任务 ID（可多选）
                    </Typography>
                    <Autocomplete
                        multiple
                        options={experimentTaskOptions}
                        value={experimentTask}
                        onChange={(_, value) => setExperimentTask(value)}
                        size="small"
                        disabled={!experimentScript}
                        disableCloseOnSelect
                        limitTags={1}
                        getOptionLabel={(option) => formatTaskName(option)}
                        isOptionEqualToValue={(option, value) => option === value}
                        renderOption={(props, option, { selected }) => (
                            <li {...props} title={option}>
                                <Checkbox size="small" checked={selected} />
                                <ListItemText primary={formatTaskName(option)} />
                            </li>
                        )}
                        filterOptions={(options, state) =>
                            options.filter((option) => normalizeOption(option).includes(state.inputValue.toLowerCase()))
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder={experimentTask.length === 0 ? '默认全部任务' : '搜索任务'}
                            />
                        )}
                    />
                </Box>

                <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <FormControlLabel
                            control={<Switch size="small" checked={showStats} onChange={(e) => setShowStats(e.target.checked)} />}
                            label={<Typography variant="body2">显示数据统计</Typography>}
                            sx={{ mr: 0 }}
                        />
                        <FormControlLabel
                            control={<Switch size="small" checked={showScriptDiff} onChange={(e) => setShowScriptDiff(e.target.checked)} />}
                            label={<Typography variant="body2">显示话术差异</Typography>}
                            sx={{ mr: 0 }}
                        />
                    </Box>
                </Box>

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
