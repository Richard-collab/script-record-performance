import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Tabs,
    Tab,
    Box,
    TextField,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Tooltip,
    Paper
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';

interface MetricRow {
    id: string;
    label: string;
    baselineValue: string;
    comparisonValue: string;
}

interface BackendDataEditorProps {
    open: boolean;
    onClose: () => void;
    onSave: (metrics: { label: string; baselineValue: string; comparisonValue: string }[]) => void;
}

const BackendDataEditor: React.FC<BackendDataEditorProps> = ({ open, onClose, onSave }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [stagingList, setStagingList] = useState<MetricRow[]>([]);

    // Manual Input State
    const [manualLabel, setManualLabel] = useState('');
    const [manualBaseline, setManualBaseline] = useState('');
    const [manualComparison, setManualComparison] = useState('');

    // Bulk Input State
    const [bulkText, setBulkText] = useState('');

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const handleAddManual = () => {
        if (!manualLabel.trim() || !manualBaseline.trim() || !manualComparison.trim()) return;

        const newRow: MetricRow = {
            id: `manual-${Date.now()}`,
            label: manualLabel.trim(),
            baselineValue: manualBaseline.trim(),
            comparisonValue: manualComparison.trim()
        };

        setStagingList([...stagingList, newRow]);
        setManualLabel('');
        setManualBaseline('');
        setManualComparison('');
    };

    const handleRemoveRow = (id: string) => {
        setStagingList(stagingList.filter(row => row.id !== id));
    };

    const handleParseBulk = () => {
        if (!bulkText.trim()) return;

        const lines = bulkText.split(/\r?\n/).filter(line => line.trim());
        const newRows: MetricRow[] = lines.map((line, index) => {
            // Handle tab or comma separated
            const parts = line.includes('\t') ? line.split('\t') : line.split(/,|，/);
            const [label = '', baseline = '', comparison = ''] = parts.map(s => s.trim());

            return {
                id: `bulk-${Date.now()}-${index}`,
                label,
                baselineValue: baseline,
                comparisonValue: comparison
            };
        }).filter(row => row.label && (row.baselineValue || row.comparisonValue));

        if (newRows.length > 0) {
            setStagingList([...stagingList, ...newRows]);
            setBulkText('');
            // Switch back to list view to show results
            setActiveTab(0);
        }
    };

    const handlePasteClipboard = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setBulkText(text);
        } catch (err) {
            console.error('Failed to read clipboard', err);
        }
    };

    const handleSave = () => {
        onSave(stagingList.map(({ label, baselineValue, comparisonValue }) => ({
            label,
            baselineValue,
            comparisonValue
        })));
        handleClose();
    };

    const handleClose = () => {
        setStagingList([]);
        setManualLabel('');
        setManualBaseline('');
        setManualComparison('');
        setBulkText('');
        setActiveTab(0);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>后程数据编辑</DialogTitle>
            <DialogContent>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs value={activeTab} onChange={handleTabChange}>
                        <Tab label="手动输入" />
                        <Tab label="批量导入" />
                    </Tabs>
                </Box>

                {/* Manual Input Tab */}
                <div role="tabpanel" hidden={activeTab !== 0}>
                    {activeTab === 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                <TextField
                                    label="字段名"
                                    value={manualLabel}
                                    onChange={(e) => setManualLabel(e.target.value)}
                                    size="small"
                                    fullWidth
                                    placeholder="例如：复拨成功率"
                                />
                                <TextField
                                    label="话术A指标"
                                    value={manualBaseline}
                                    onChange={(e) => setManualBaseline(e.target.value)}
                                    size="small"
                                    fullWidth
                                    placeholder="例如：12.3%"
                                />
                                <TextField
                                    label="话术B指标"
                                    value={manualComparison}
                                    onChange={(e) => setManualComparison(e.target.value)}
                                    size="small"
                                    fullWidth
                                    placeholder="例如：10.8%"
                                />
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={handleAddManual}
                                    disabled={!manualLabel || !manualBaseline || !manualComparison}
                                    sx={{ whiteSpace: 'nowrap', height: 40 }}
                                >
                                    添加
                                </Button>
                            </Box>

                            {stagingList.length > 0 ? (
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>字段名</TableCell>
                                                <TableCell>话术A指标</TableCell>
                                                <TableCell>话术B指标</TableCell>
                                                <TableCell align="center" width={80}>操作</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {stagingList.map((row) => (
                                                <TableRow key={row.id}>
                                                    <TableCell>{row.label}</TableCell>
                                                    <TableCell>{row.baselineValue}</TableCell>
                                                    <TableCell>{row.comparisonValue}</TableCell>
                                                    <TableCell align="center">
                                                        <Tooltip title="删除">
                                                            <IconButton size="small" onClick={() => handleRemoveRow(row.id)} color="error">
                                                                <DeleteOutlineIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary', border: '1px dashed #ccc', borderRadius: 1 }}>
                                    <Typography variant="body2">
                                        暂无待添加数据，请在上方输入或通过“批量导入”添加
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}
                </div>

                {/* Batch Import Tab */}
                <div role="tabpanel" hidden={activeTab !== 1}>
                    {activeTab === 1 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                             <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<ContentPasteIcon />}
                                    onClick={handlePasteClipboard}
                                    size="small"
                                >
                                    粘贴剪贴板内容
                                </Button>
                            </Box>
                            <TextField
                                label="批量文本数据"
                                multiline
                                rows={6}
                                value={bulkText}
                                onChange={(e) => setBulkText(e.target.value)}
                                placeholder={"格式示例：\n字段名, 话术A指标, 话术B指标\n后程核验通过率, 12.3%, 10.8%\n复拨成功率\t23.1%\t21.4%"}
                                fullWidth
                                helperText="支持逗号或制表符分隔，每行一条数据"
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                    variant="contained"
                                    onClick={handleParseBulk}
                                    disabled={!bulkText.trim()}
                                >
                                    解析并添加到列表
                                </Button>
                            </Box>
                        </Box>
                    )}
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>取消</Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={stagingList.length === 0}
                >
                    确认导入 ({stagingList.length})
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BackendDataEditor;
