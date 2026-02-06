import React from 'react';
import { Box, Typography, Button, IconButton } from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';

interface HeaderProps {
    lastUpdated: string;
}

const Header: React.FC<HeaderProps> = ({ lastUpdated }) => {
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
                >
                    导出报表
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<ShareOutlinedIcon />}
                    size="small"
                >
                    分享
                </Button>
            </Box>
        </Box>
    );
};

export default Header;
