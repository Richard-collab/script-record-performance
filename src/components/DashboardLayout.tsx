import React from 'react';
import { Box, CssBaseline } from '@mui/material';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    return (
        <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            <CssBaseline />
            <Sidebar />
            <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                {children}
            </Box>
        </Box>
    );
};

export default DashboardLayout;
