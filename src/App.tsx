import React, { useEffect, useState } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import DashboardLayout from './components/DashboardLayout';
import FilterPanel from './components/FilterPanel';
import Header from './components/Header';
import MetricTable from './components/MetricTable';
import { fetchAnalyticsData } from './services/mockApi';
import type { AnalyticsData, FilterParams } from './types/analytics';
import { Box, CircularProgress } from '@mui/material';

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
            const result = await fetchAnalyticsData(filters);
            setData(result);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        handleSearch({
            dateRange: [new Date(), new Date()],
            baselineScript: 'A1',
            baselineTask: '10086',
            experimentScript: 'B1',
            experimentTask: '10087'
        });
    }, []);

    return (
        <ThemeProvider theme={theme}>
            <DashboardLayout>
                <Box sx={{ display: 'flex', height: '100%' }}>
                    <FilterPanel onSearch={handleSearch} />
                    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', bgcolor: 'background.default' }}>
                        {data ? (
                            <>
                                <Header lastUpdated={data.lastUpdated} />
                                {loading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                        <CircularProgress />
                                    </Box>
                                ) : (
                                    <MetricTable data={data} />
                                )}
                            </>
                        ) : (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                <CircularProgress />
                            </Box>
                        )}
                    </Box>
                </Box>
            </DashboardLayout>
        </ThemeProvider>
    );
}

export default App;
