import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';

interface HeaderProps {
    lastUpdated: string;
}

const Header: React.FC<HeaderProps> = ({ lastUpdated }) => {
    const handleExport = () => {
        // Mock export functionality
        alert("正在导出报表，请稍候...");
    };

    const handleShare = () => {
        // Mock share functionality
        alert("分享链接已复制到剪贴板！");
    };

    return (
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
                    size="small"
                    onClick={handleExport}
                >
                    导出报表
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<ShareOutlinedIcon />}
                    size="small"
                    onClick={handleShare}
                >
                    分享
                </Button>
            </Box>
        </Box>
    );
};

export default Header;
