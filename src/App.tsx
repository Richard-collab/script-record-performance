import React, { useEffect, useState } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import DashboardLayout from './components/DashboardLayout';
import FilterPanel from './components/FilterPanel';
import Header from './components/Header';
import MetricTable from './components/MetricTable';
import { fetchAnalyticsData } from './utils/api';
import type { AnalyticsData, FilterParams } from './types/analytics';
import { Box, CircularProgress, Typography } from '@mui/material';

// Custom theme to match the clean, professional look
const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2', // Standard blue
        },
        background: {
            default: '#f4f6f8', // Light gray background
            paper: '#ffffff',
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        button: {
            textTransform: 'none', // Remove uppercase default
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: 'none',
                    },
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderBottom: '1px solid #f0f0f0',
                },
                head: {
                    backgroundColor: '#f9fafb',
                    fontWeight: 600,
                }
            }
        }
    },
});

function App() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (filters: FilterParams) => {
        setLoading(true);
        try {
            const result = await fetchAnalyticsData(
                filters.dateRange,
                filters.baselineScript,
                filters.baselineTask,  // 现在支持 string | string[]
                filters.experimentScript,
                filters.experimentTask  // 现在支持 string | string[]
            );
            setData(result);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    // Initial load - 注释掉初始加载，等待用户在筛选面板选择后再加载
    // useEffect(() => {
    //     handleSearch({
    //         dateRange: [new Date(), new Date()],
    //         baselineScript: 'A1',
    //         baselineTask: '10086',
    //         experimentScript: 'B1',
    //         experimentTask: '10087'
    //     });
    // }, []);

    return (
        <ThemeProvider theme={theme}>
            <DashboardLayout>
                <Box sx={{ display: 'flex', height: '100%' }}>
                    <FilterPanel onSearch={handleSearch} />
                    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', bgcolor: 'background.default' }}>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                <CircularProgress />
                            </Box>
                        ) : data ? (
                            <>
                                <Header lastUpdated={data.lastUpdated} data={data} />
                                <MetricTable data={data} />
                            </>
                        ) : (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: 2 }}>
                                <Typography variant="h6" color="text.secondary">
                                    请在左侧筛选面板选择分析参数
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    选择日期、基准话术和实验话术后，点击"开始分析"按钮
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
            </DashboardLayout>
        </ThemeProvider>
    );
}

export default App;
