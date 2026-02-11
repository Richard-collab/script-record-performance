import React, { useState } from 'react';
import { Box, Typography, Button, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, ListItemText, Snackbar, Alert } from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import TableChartIcon from '@mui/icons-material/TableChart';
import ImageIcon from '@mui/icons-material/Image';
import type { AnalyticsData } from '../types/analytics';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import QRCode from "react-qr-code";
import dayjs from 'dayjs';
import BackendDataEditor from './BackendDataEditor';

interface HeaderProps {
    lastUpdated: string;
    data?: AnalyticsData;
    customMetrics?: { id: string; label: string; baselineValue: string; comparisonValue: string }[];
    onAddMetric?: (label: string, baselineValue: string, comparisonValue: string) => void;
    onAddMetrics?: (rows: { label: string; baselineValue: string; comparisonValue: string }[]) => void;
    onUpdateMetrics?: (rows: { id: string; label: string; baselineValue: string; comparisonValue: string }[]) => void;
}

const Header: React.FC<HeaderProps> = ({ lastUpdated, data, customMetrics, onAddMetric, onAddMetrics, onUpdateMetrics }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [editorOpen, setEditorOpen] = useState(false);
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
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
    const handleImageExportClick = async () => {
        handleClose();
        const element = document.getElementById('metric-table-container'); // 需要在 MetricTable 增加此 ID
        if (!element) return;

        // 保存原始样式
        const originalOverflow = element.style.overflow;
        const originalHeight = element.style.height;

        try {
            // 临时修改样式以展开所有内容
            element.style.overflow = 'visible';
            element.style.height = 'auto';

            const canvas = await html2canvas(element, {
                backgroundColor: '#ffffff',
                scale: 2, // 提高清晰度
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight,
                height: element.scrollHeight,
                width: element.scrollWidth,
                onclone: (clonedDoc) => {
                    // 确保克隆的元素也是展开的
                    const clonedElement = clonedDoc.getElementById('metric-table-container');
                    if (clonedElement) {
                        clonedElement.style.overflow = 'visible';
                        clonedElement.style.height = 'auto';
                        clonedElement.style.maxHeight = 'none';
                    }
                }
            });
            
            const link = document.createElement('a');
            link.download = `分析报表_${dayjs().format('YYYYMMDD')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Export image failed:', error);
            alert('导出图片失败，请重试');
        } finally {
            // 恢复原始样式
            element.style.overflow = originalOverflow;
            element.style.height = originalHeight;
        }
    };

    const handleOpenEditor = () => {
        setEditorOpen(true);
    };

    const handleSaveMetrics = (metrics: { id: string; label: string; baselineValue: string; comparisonValue: string }[]) => {
        // Allow saving empty list (deleting all)
        if (onUpdateMetrics) {
            onUpdateMetrics(metrics);
        } else if (metrics.length > 0) {
            // Fallback for legacy behavior if onUpdateMetrics is not provided
            if (onAddMetrics) {
                onAddMetrics(metrics);
            } else if (onAddMetric) {
                metrics.forEach(row => onAddMetric(row.label, row.baselineValue, row.comparisonValue));
            }
        }
    };

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
                        话术数据统计看板2.0
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        当日数据约半小时同步一次
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
                        onClick={handleOpenEditor}
                        disabled={!data}
                    >
                        后程数据编辑
                    </Button>
                </Box>
            </Box>

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

            <BackendDataEditor
                open={editorOpen}
                initialData={customMetrics}
                onClose={() => setEditorOpen(false)}
                onSave={handleSaveMetrics}
            />

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
