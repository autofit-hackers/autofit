import { Container } from "@material-ui/core";
import AppBar from "@material-ui/core/AppBar";
import Button from "@material-ui/core/Button";
import { grey, orange } from "@material-ui/core/colors";
import IconButton from "@material-ui/core/IconButton";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import MenuIcon from "@material-ui/icons/Menu";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useState } from "react";
import "./App.css";
import SignIn from "./SignIn";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            flexGrow: 1,
            color: "#00ff00",
            backgroundColor: "#bbbbbb",
        },
        menuButton: {
            marginRight: theme.spacing(2),
        },
        title: {
            flexGrow: 1,
            textAlign: "center",
        },
    }),
);

const theme = createTheme({
    palette: {
        primary: {
            main: grey[500],
        },
        secondary: {
            main: orange[500],
        },
    },
});

function Themes() {
    const classes = useStyles();
    const [count, setCount] = useState(0);
    return (
        <div>
            <div className={classes.root}>
                <AppBar position="static">
                    <Toolbar>
                        <IconButton
                            edge="start"
                            className={classes.menuButton}
                            color="inherit"
                            aria-label="menu"
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" className={classes.title}>
                            News
                        </Typography>
                        <Button color="inherit">Login</Button>
                    </Toolbar>
                </AppBar>
                <SignIn />
            </div>
            <div>
                <ThemeProvider theme={theme}>
                    <Container maxWidth="xs">
                        <p style={{ textAlign: "center" }}>Answer = {count}</p>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => setCount(count + 2)}
                            fullWidth
                            style={{ marginTop: 3, marginBottom: 20 }}
                        >
                            +2
                        </Button>
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={() => setCount(count + 1)}
                            fullWidth
                            style={{ marginTop: 3, marginBottom: 2 }}
                        >
                            +1
                        </Button>
                    </Container>
                </ThemeProvider>
            </div>
        </div>
    );
}

export default Themes;
