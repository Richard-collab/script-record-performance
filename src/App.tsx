import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { Box, CircularProgress, Typography } from '@mui/material';
import DashboardLayout from './components/DashboardLayout';
import FilterPanel from './components/FilterPanel';
import Header from './components/Header';
import MetricTable from './components/MetricTable';
import ScriptDiffViewer from './components/ScriptDiffViewer';
import { theme } from './theme';
import { useAnalytics } from './hooks/useAnalytics';

function App() {
    const {
        data,
        loading,
        activeFilters,
        initialFilters,
        urlParsed,
        handleSearch,
        handleMetricUpdate,
        handleAddCustomMetric,
        handleAddCustomMetrics
    } = useAnalytics();

    const [showScriptDiff, setShowScriptDiff] = useState(false);

    return (
        <ThemeProvider theme={theme}>
            <DashboardLayout>
                <Box sx={{ display: 'flex', height: '100%' }}>
                    <FilterPanel 
                        key={urlParsed ? 'loaded' : 'loading'}
                        onSearch={(filters) => handleSearch(filters)}
                        initialFilters={initialFilters} 
                        onShowDiffChange={setShowScriptDiff}
                    />
                    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', bgcolor: 'background.default' }}>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                <CircularProgress />
                            </Box>
                        ) : data ? (
                            <>
                                <Header
                                    lastUpdated={data.lastUpdated}
                                    data={data}
                                    onAddMetric={handleAddCustomMetric}
                                    onAddMetrics={handleAddCustomMetrics}
                                />
                                <Box sx={{ flexGrow: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                                    <MetricTable data={data} onMetricUpdate={handleMetricUpdate} />
                                    {showScriptDiff && activeFilters.baselineScript && activeFilters.experimentScript && (
                                        <ScriptDiffViewer
                                            baselineScript={activeFilters.baselineScript}
                                            experimentScript={activeFilters.experimentScript}
                                        />
                                    )}
                                </Box>
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
