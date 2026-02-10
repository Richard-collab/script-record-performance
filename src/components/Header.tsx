import React, { useMemo, useRef, useState } from 'react';
import { Box, Typography, Button, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, ListItemText, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip, Snackbar, Alert } from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import TableChartIcon from '@mui/icons-material/TableChart';
import ImageIcon from '@mui/icons-material/Image';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import type { AnalyticsData } from '../types/analytics';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import QRCode from "react-qr-code";
import dayjs from 'dayjs';

interface HeaderProps {
    lastUpdated: string;
    data?: AnalyticsData;
    onAddMetric?: (label: string, baselineValue: string, comparisonValue: string) => void;
    onAddMetrics?: (rows: { label: string; baselineValue: string; comparisonValue: string }[]) => void;
}

interface BulkMetricRow {
    id: string;
    label: string;
    baselineValue: string;
    comparisonValue: string;
}

const Header: React.FC<HeaderProps> = ({ lastUpdated, data, onAddMetric, onAddMetrics }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [imageDialogOpen, setImageDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [metricLabel, setMetricLabel] = useState('');
    const [baselineValue, setBaselineValue] = useState('');
    const [comparisonValue, setComparisonValue] = useState('');
    const [bulkRows, setBulkRows] = useState<BulkMetricRow[]>([]);
    const [bulkText, setBulkText] = useState('');
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const rowIdRef = useRef(1);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleShare = async () => {
        const url = window.location.href;
        setShareUrl(url);
        
        try {
            await navigator.clipboard.writeText(url);
            setSnackbarOpen(true);
            setShareDialogOpen(true);
        } catch (err) {
            console.error('Failed to copy link: ', err);
            // Even if copy fails, show the QR dialog so user can use it or copy manually
            setShareDialogOpen(true);
        }
    };

    const handleCloseShareDialog = () => {
        setShareDialogOpen(false);
    };

    const handleCopyAndClose = async () => {
        let success = false;
        
        // 优先处理非安全环境（HTTP）或不支持 Clipboard API 的情况
        // 在这些情况下必须同步调用 execCommand 以保留用户手势
        if (!navigator.clipboard || (window.isSecureContext === false)) {
            try {
                const textArea = document.createElement('textarea');
                textArea.value = shareUrl;
                
                // 确保元素不可见但可交互
                textArea.style.position = 'fixed';
                textArea.style.left = '-9999px';
                textArea.style.top = '0';
                textArea.setAttribute('readonly', '');
                
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                success = document.execCommand('copy');
                document.body.removeChild(textArea);
            } catch (err) {
                console.error('Legacy copy failed: ', err);
            }
        } else {
            // 安全环境使用现代 API
            try {
                await navigator.clipboard.writeText(shareUrl);
                success = true;
            } catch (err) {
                console.error('Clipboard API failed: ', err);
                // 注意：这里由于 await 的存在，降级方案可能因为丢失用户手势而失败
            }
        }

        if (success) {
            setSnackbarOpen(true);
        } else {
            // 如果都失败了，提示用户手动复制（极其罕见的情况）
            alert('自动复制失败，请手动复制链接');
        }
        
        setShareDialogOpen(false);
    };

    // Excel导出功能
    const handleExportExcel = () => {
        handleClose();
        if (!data) {
            alert('暂无数据可导出');
            return;
        }

        const wb = XLSX.utils.book_new();
        const baselineTitle = data.baselineTitle || '包名 A';
        const comparisonTitle = data.comparisonTitle || '包名 B';

        const sheetData: any[][] = [[
            '指标名称',
            baselineTitle,
            comparisonTitle,
            '差异'
        ]];

        const merges: XLSX.Range[] = [];

        data.groups.forEach(group => {
            // 组标题行（与页面一致，占满4列）
            if (group.id !== 'core') {
                const rowIndex = sheetData.length;
                sheetData.push([group.title, '', '', '']);
                merges.push({ s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: 3 } });
            }

            group.metrics.forEach(metric => {
                let diffText = metric.diffValue || '--';
                if (metric.diffDirection === 'up') {
                    diffText = `↑ ${diffText}`;
                } else if (metric.diffDirection === 'down') {
                    diffText = `↓ ${diffText}`;
                }

                sheetData.push([
                    metric.label,
                    metric.baselineValue,
                    metric.comparisonValue,
                    `${diffText} (${metric.diffPercentage || '0%'})`
                ]);
            });
        });

        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        ws['!merges'] = merges;
        XLSX.utils.book_append_sheet(wb, ws, '数据对比');
        XLSX.writeFile(wb, `数据报表_${dayjs().format('YYYYMMDD')}.xlsx`);
    };

    // 图片导出功能
    const handleImageExportClick = () => {
        handleClose();
        setImageDialogOpen(true);
    };

    const handleExportImage = async (mode: 'single' | 'multiple') => {
        setImageDialogOpen(false);
        const element = document.getElementById('metric-table-container'); // 需要在 MetricTable 增加此 ID
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                backgroundColor: '#ffffff',
                scale: 2 // 提高清晰度
            });
            
            const link = document.createElement('a');
            link.download = `分析报表_${dayjs().format('YYYYMMDD')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Export image failed:', error);
            alert('导出图片失败，请重试');
        }
    };

    // 后程数据编辑相关
    const handleOpenEditDialog = () => {
        setEditDialogOpen(true);
        if (bulkRows.length === 0) {
            setBulkRows([createEmptyRow()]);
        }
    };

    const handleCloseEditDialog = () => {
        setEditDialogOpen(false);
        setMetricLabel('');
        setBaselineValue('');
        setComparisonValue('');
        setBulkRows([]);
        setBulkText('');
    };

    const handleAddMetric = () => {
        if (!metricLabel.trim() || !baselineValue.trim() || !comparisonValue.trim()) {
            return;
        }
        if (onAddMetric) {
            onAddMetric(metricLabel.trim(), baselineValue.trim(), comparisonValue.trim());
        }
        handleCloseEditDialog();
    };

    const handleAddRow = () => {
        setBulkRows(prev => [...prev, createEmptyRow()]);
    };

    const handleRemoveRow = (rowId: string) => {
        setBulkRows(prev => prev.filter(row => row.id !== rowId));
    };

    const handleRowChange = (rowId: string, field: keyof BulkMetricRow, value: string) => {
        setBulkRows(prev => prev.map(row => (row.id === rowId ? { ...row, [field]: value } : row)));
    };

    const parseClipboardRows = (text: string): BulkMetricRow[] => {
        const lines = text
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(Boolean);

        return lines.map(line => {
            const cols = line.includes('\t') ? line.split('\t') : line.split(',');
            const [label = '', baselineValue = '', comparisonValue = ''] = cols.map(col => col.trim());
            return {
                id: `row-${rowIdRef.current++}`,
                label,
                baselineValue,
                comparisonValue
            };
        });
    };

    const createEmptyRow = (): BulkMetricRow => ({
        id: `row-${rowIdRef.current++}`,
        label: '',
        baselineValue: '',
        comparisonValue: ''
    });

    const handlePasteFromClipboard = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setBulkText(text);
            // Optional: auto parse? Let's just fill the text area for user review
        } catch (err) {
            console.error('Failed to read clipboard', err);
            alert('无法读取剪贴板，请手动粘贴');
        }
    };

    const handleParseBulkText = () => {
        const parsedRows = parseClipboardRows(bulkText);
        if (parsedRows.length === 0) {
            alert('未识别到可用数据');
            return;
        }
        setBulkRows([...parsedRows, createEmptyRow()]);
    };

    const handleClearRows = () => {
        setBulkRows([createEmptyRow()]);
    };

    const handleBulkAddMetrics = () => {
        const rowsToAdd = bulkRows
            .map(row => ({
                label: row.label.trim(),
                baselineValue: row.baselineValue.trim(),
                comparisonValue: row.comparisonValue.trim()
            }))
            .filter(row => row.label && row.baselineValue && row.comparisonValue);

        if (rowsToAdd.length === 0) {
            return;
        }

        if (onAddMetrics) {
            onAddMetrics(rowsToAdd);
        } else if (onAddMetric) {
            rowsToAdd.forEach(row => onAddMetric(row.label, row.baselineValue, row.comparisonValue));
        }

        handleCloseEditDialog();
    };

    const isBulkAddDisabled = useMemo(() => {
        return !bulkRows.some(row => row.label.trim() && row.baselineValue.trim() && row.comparisonValue.trim());
    }, [bulkRows]);

    return (
        <>
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 3,
                borderBottom: '1px solid #e0e0e0',
                bgcolor: 'background.paper'
            }}>
                <Box>
                    <Typography variant="h5" fontWeight="bold">
                        数据统计看板
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        最后更新: {lastUpdated}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<FileDownloadOutlinedIcon />}
                        endIcon={<KeyboardArrowDownIcon />}
                        size="small"
                        onClick={handleClick}
                        disabled={!data}
                    >
                        导出报表
                    </Button>
                    <Menu
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                    >
                        <MenuItem onClick={handleExportExcel}>
                            <TableChartIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                            <ListItemText primary="导出为Excel" />
                        </MenuItem>
                        <MenuItem onClick={handleImageExportClick}>
                            <ImageIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                            <ListItemText primary="导出为图片" />
                        </MenuItem>
                    </Menu>
                    <Button
                        variant="outlined"
                        startIcon={<ShareOutlinedIcon />}
                        size="small"
                        onClick={handleShare}
                    >
                        分享
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={handleOpenEditDialog}
                        disabled={!data}
                    >
                        后程数据编辑
                    </Button>
                </Box>
            </Box>

            {/* 图片导出选项对话框 */}
            <Dialog open={imageDialogOpen} onClose={() => setImageDialogOpen(false)}>
                <DialogTitle>选择图片导出方式</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pt: 1 }}>
                        <Button
                            variant="outlined"
                            onClick={() => handleExportImage('single')}
                            sx={{ justifyContent: 'flex-start', py: 1.5 }}
                        >
                            导出为一张图片
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => handleExportImage('multiple')}
                            sx={{ justifyContent: 'flex-start', py: 1.5 }}
                        >
                            导出为三张图片
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setImageDialogOpen(false)}>取消</Button>
                </DialogActions>
            </Dialog>
            
            {/* 分享二维码弹窗 */}
            <Dialog open={shareDialogOpen} onClose={handleCloseShareDialog}>
                <DialogTitle sx={{ textAlign: 'center' }}>分享页面</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 2 }}>
                    <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid #eee' }}>
                        <QRCode
                            value={shareUrl}
                            size={180}
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            viewBox={`0 0 180 180`}
                        />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center', px: 2 }}>
                        链接已复制到剪贴板，您也可以扫描上方二维码分享
                    </Typography>
                    <Box sx={{ mt: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1, width: '100%', wordBreak: 'break-all', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                        {shareUrl}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                    <Button onClick={handleCopyAndClose} variant="outlined">复制并关闭</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
                <DialogTitle>后程数据编辑（可批量导入）</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            支持 CSV/TSV 粘贴（字段名、话术A指标、话术B指标），也可直接在表格内编辑。
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<ContentPasteIcon />}
                                onClick={handlePasteFromClipboard}
                            >
                                粘贴剪贴板
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={handleParseBulkText}
                            >
                                解析文本
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={handleAddRow}
                            >
                                添加一行
                            </Button>
                            <Button
                                variant="text"
                                size="small"
                                onClick={handleClearRows}
                            >
                                清空
                            </Button>
                        </Box>
                        <TextField
                            label="批量文本（每行: 字段名,话术A指标,话术B指标）"
                            value={bulkText}
                            onChange={(e) => setBulkText(e.target.value)}
                            placeholder={"后程核验通过率, 12.3%, 10.8%\n复拨成功率\t23.1%\t21.4%"}
                            minRows={3}
                            multiline
                            fullWidth
                            size="small"
                        />
                        <TableContainer sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ width: '36%' }}>字段名</TableCell>
                                        <TableCell sx={{ width: '24%' }}>话术A指标</TableCell>
                                        <TableCell sx={{ width: '24%' }}>话术B指标</TableCell>
                                        <TableCell sx={{ width: '16%' }} align="center">操作</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {bulkRows.map(row => (
                                        <TableRow key={row.id}>
                                            <TableCell>
                                                <TextField
                                                    value={row.label}
                                                    onChange={(e) => handleRowChange(row.id, 'label', e.target.value)}
                                                    size="small"
                                                    placeholder="例如：后程核验通过率"
                                                    fullWidth
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    value={row.baselineValue}
                                                    onChange={(e) => handleRowChange(row.id, 'baselineValue', e.target.value)}
                                                    size="small"
                                                    placeholder="例如：12.3%"
                                                    fullWidth
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    value={row.comparisonValue}
                                                    onChange={(e) => handleRowChange(row.id, 'comparisonValue', e.target.value)}
                                                    size="small"
                                                    placeholder="例如：10.8%"
                                                    fullWidth
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Tooltip title="删除">
                                                    <IconButton size="small" onClick={() => handleRemoveRow(row.id)}>
                                                        <DeleteOutlineIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="字段名"
                                value={metricLabel}
                                onChange={(e) => setMetricLabel(e.target.value)}
                                fullWidth
                                size="small"
                            />
                            <TextField
                                label="话术A指标"
                                value={baselineValue}
                                onChange={(e) => setBaselineValue(e.target.value)}
                                fullWidth
                                size="small"
                            />
                            <TextField
                                label="话术B指标"
                                value={comparisonValue}
                                onChange={(e) => setComparisonValue(e.target.value)}
                                fullWidth
                                size="small"
                            />
                            <Button
                                variant="outlined"
                                onClick={handleAddMetric}
                                disabled={!metricLabel.trim() || !baselineValue.trim() || !comparisonValue.trim()}
                                sx={{ whiteSpace: 'nowrap' }}
                            >
                                追加
                            </Button>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseEditDialog}>取消</Button>
                    <Button
                        variant="contained"
                        onClick={handleBulkAddMetrics}
                        disabled={isBulkAddDisabled}
                    >
                        导入
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={2000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
                    分享链接已复制到剪贴板
                </Alert>
            </Snackbar>
        </>
    );
};

export default Header;
