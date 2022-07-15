import { green, pink, red } from '@mui/material/colors';
import { createTheme } from '@mui/material/styles';

// Create a theme instance.
const theme = createTheme({
    palette: {
        primary: {
            main: green[800]
        },
        secondary: {
            main: '#19857b'
        },
        background: {
            default: pink[300]
        },
        error: {
            main: red.A400
        }
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '2em'
                }
            }
        }
    }
});
export default theme;
