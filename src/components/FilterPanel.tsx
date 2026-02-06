import React from 'react';
import { Box, Typography, TextField, MenuItem, Button, Select, FormControl, InputLabel, Divider, Switch, FormControlLabel } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import SearchIcon from '@mui/icons-material/Search';
import dayjs, { type Dayjs } from 'dayjs';
import type { FilterParams } from '../types/analytics';

interface FilterPanelProps {
    onSearch: (filters: FilterParams) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ onSearch }) => {
    const [startDate, setStartDate] = React.useState<Dayjs | null>(dayjs('2024-10-01'));
    const [endDate, setEndDate] = React.useState<Dayjs | null>(dayjs('2024-10-07'));

    // Mock selection state
    const [baselineScript, setBaselineScript] = React.useState('A1');
    const [baselineTask, setBaselineTask] = React.useState('10086');
    const [experimentScript, setExperimentScript] = React.useState('B1');
    const [experimentTask, setExperimentTask] = React.useState('10087');
    const [showStats, setShowStats] = React.useState(true);

    const handleSearch = () => {
        onSearch({
            dateRange: [startDate?.toDate() || null, endDate?.toDate() || null],
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
                    >
                        <MenuItem value="A1">A1版 - 官方标准话术</MenuItem>
                        <MenuItem value="A2">A2版 - 简化话术</MenuItem>
                    </Select>

                    <Typography variant="body2" fontWeight="bold" gutterBottom>
                        任务 ID
                    </Typography>
                    <Select
                        fullWidth
                        size="small"
                        value={baselineTask}
                        onChange={(e) => setBaselineTask(e.target.value)}
                    >
                        <MenuItem value="10086">10086</MenuItem>
                        <MenuItem value="10088">10088</MenuItem>
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
                    >
                        <MenuItem value="B1">B1版 - 情感增强话术</MenuItem>
                        <MenuItem value="B2">B2版 - 促销话术</MenuItem>
                    </Select>

                    <Typography variant="body2" fontWeight="bold" gutterBottom>
                        任务 ID
                    </Typography>
                    <Select
                        fullWidth
                        size="small"
                        value={experimentTask}
                        onChange={(e) => setExperimentTask(e.target.value)}
                    >
                        <MenuItem value="10087">10087</MenuItem>
                        <MenuItem value="10089">10089</MenuItem>
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
