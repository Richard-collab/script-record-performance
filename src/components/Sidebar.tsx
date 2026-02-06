import React from 'react';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Divider } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssessmentIcon from '@mui/icons-material/Assessment';

const drawerWidth = 240;

const Sidebar: React.FC = () => {
    return (
        <Drawer
            variant="permanent"
            sx={{
                width: 200, // Narrower sidebar as per image
                flexShrink: 0,
                [`& .MuiDrawer-paper`]: { width: 200, boxSizing: 'border-box' },
            }}
        >
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 24, height: 24, bgcolor: 'primary.main', borderRadius: 1 }} />
                <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                        话术分析看板
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Analytics Pro
                    </Typography>
                </Box>
            </Box>
            <Divider />
            <List>
                {/* Mock navigation items */}
            </List>
        </Drawer>
    );
};

export default Sidebar;
