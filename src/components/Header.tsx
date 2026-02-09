import React, { useState } from 'react';
import { Box, Typography, Button, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, ListItemText } from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import TableChartIcon from '@mui/icons-material/TableChart';
import ImageIcon from '@mui/icons-material/Image';
import type { AnalyticsData } from '../types/analytics';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

interface HeaderProps {
    lastUpdated: string;
    data?: AnalyticsData;
}

const Header: React.FC<HeaderProps> = ({ lastUpdated, data }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [imageDialogOpen, setImageDialogOpen] = useState(false);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    // Excel导出功能
    const handleExportExcel = () => {
        handleClose();
        if (!data) {
            alert('暂无数据可导出');
            return;
        }

        const wb = XLSX.utils.book_new();
        
        // 创建三张工作表
        const sheets = [
            { name: data.baselineTitle || '话术 A (基准)', side: 'baseline' as const },
            { name: data.comparisonTitle || '话术 B (对比)', side: 'comparison' as const },
            { name: '差异值 (B - A)', side: 'diff' as const }
        ];

        sheets.forEach(({ name, side }) => {
            const sheetData: any[][] = [[name], []];

            data.groups.forEach(group => {
                // 添加组标题
                if (group.id !== 'core') {
                    sheetData.push([group.title], []);
                }

                // 添加指标数据
                group.metrics.forEach(metric => {
                    if (side === 'baseline') {
                        sheetData.push([metric.label, metric.baselineValue]);
                    } else if (side === 'comparison') {
                        sheetData.push([metric.label, metric.comparisonValue]);
                    } else {
                        sheetData.push([metric.label, metric.diffValue || '--']);
                    }
                });

                sheetData.push([]);
            });

            const ws = XLSX.utils.aoa_to_sheet(sheetData);
            
            // 设置列宽
            ws['!cols'] = [
                { wch: 30 },
                { wch: 20 }
            ];

            XLSX.utils.book_append_sheet(wb, ws, name.substring(0, 31)); // Excel工作表名称限制31个字符
        });

        // 生成文件名
        const timestamp = new Date().toLocaleString('zh-CN').replace(/[/:]/g, '-').replace(/\s/g, '_');
        XLSX.writeFile(wb, `数据统计报表_${timestamp}.xlsx`);
    };

    // 图片导出功能
    const handleExportImage = (mode: 'single' | 'multiple') => {
        setImageDialogOpen(false);
        // 等待对话框关闭动画完成
        setTimeout(() => {
            exportAsImage(mode);
        }, 300);
    };

    const exportAsImage = async (mode: 'single' | 'multiple') => {
        try {
            if (mode === 'single') {
                // 导出整个表格区域为一张图片
                const element = document.querySelector('[data-export-area]') as HTMLElement;
                if (!element) {
                    alert('未找到可导出的内容');
                    return;
                }

                // 保存原始样式
                const originalOverflow = element.style.overflow;
                const originalHeight = element.style.height;
                
                // 临时移除overflow限制以捕获完整内容
                element.style.overflow = 'visible';
                element.style.height = 'auto';

                const canvas = await html2canvas(element, {
                    backgroundColor: '#f4f6f8',
                    scale: 2,
                    logging: false,
                    useCORS: true,
                    scrollY: -window.scrollY,
                    scrollX: -window.scrollX,
                    windowWidth: element.scrollWidth,
                    windowHeight: element.scrollHeight
                });

                // 恢复原始样式
                element.style.overflow = originalOverflow;
                element.style.height = originalHeight;

                const link = document.createElement('a');
                const timestamp = new Date().toLocaleString('zh-CN').replace(/[/:]/g, '-').replace(/\s/g, '_');
                link.download = `数据统计报表_${timestamp}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            } else {
                // 导出为三张图片
                const cards = document.querySelectorAll('[data-card-index]');
                if (cards.length === 0) {
                    alert('未找到可导出的内容');
                    return;
                }

                for (let i = 0; i < cards.length; i++) {
                    const cardWrapper = cards[i] as HTMLElement;
                    const card = cardWrapper.querySelector('div[class*="MuiPaper-root"]') as HTMLElement;
                    
                    if (!card) continue;

                    // 保存原始样式
                    const originalOverflow = card.style.overflow;
                    const originalHeight = card.style.height;
                    
                    // 临时移除overflow限制以捕获完整内容
                    card.style.overflow = 'visible';
                    card.style.height = 'auto';

                    const canvas = await html2canvas(card, {
                        backgroundColor: '#ffffff',
                        scale: 2,
                        logging: false,
                        useCORS: true,
                        scrollY: -window.scrollY,
                        scrollX: -window.scrollX,
                        windowWidth: card.scrollWidth,
                        windowHeight: card.scrollHeight
                    });

                    // 恢复原始样式
                    card.style.overflow = originalOverflow;
                    card.style.height = originalHeight;

                    const link = document.createElement('a');
                    const timestamp = new Date().toLocaleString('zh-CN').replace(/[/:]/g, '-').replace(/\s/g, '_');
                    const cardNames = ['基准数据', '对比数据', '差异值'];
                    link.download = `数据统计报表_${cardNames[i]}_${timestamp}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();

                    // 延迟一下，避免浏览器阻止多个下载
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        } catch (error) {
            console.error('导出图片失败:', error);
            alert('导出图片失败，请重试');
        }
    };

    const handleImageExportClick = () => {
        handleClose();
        if (!data) {
            alert('暂无数据可导出');
            return;
        }
        setImageDialogOpen(true);
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
                    >
                        分享
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
        </>
    );
};

export default Header;
