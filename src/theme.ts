import { createTheme } from '@mui/material/styles';

// Custom theme to match the clean, professional look
export const theme = createTheme({
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
