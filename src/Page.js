// https://github.com/mui-org/material-ui/tree/master/docs/src/pages/getting-started/templates/checkout
import React from "react";
import { useHistory } from "react-router-dom";
import {
  makeStyles,
  CssBaseline,
  AppBar,
  Toolbar,
  Paper,
  Link,
  Typography,
  Button,
  IconButton,
} from "@material-ui/core";
import AccountCircle from "@material-ui/icons/AccountCircle";

import * as server from "./server";

function Copyright() {
  return (
    <Typography variant="body2" color="textSecondary" align="center">
      {"Copyright © "}
      <Link color="inherit" href="https://material-ui.com/">
        My Waiver App
      </Link>{" "}
      {new Date().getFullYear()}
      {"."}
    </Typography>
  );
}

const useStyles = makeStyles((theme) => ({
  appBar: {
    position: "relative",
  },
  title: {
    flexGrow: 1,
  },
  layout: {
    width: "auto",
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(2),
    [theme.breakpoints.up(600 + theme.spacing(2) * 2)]: {
      width: (props) => props.contentWidth,
      marginLeft: "auto",
      marginRight: "auto",
    },
  },
  paper: {
    overflow: "hidden",
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
    padding: theme.spacing(2),
    [theme.breakpoints.up(600 + theme.spacing(3) * 2)]: {
      marginTop: theme.spacing(6),
      marginBottom: theme.spacing(6),
      padding: theme.spacing(3),
    },
  },
}));

export default function Page({
  title,
  contentWidth,
  showUser,
  showCopyright,
  children,
}) {
  const classes = useStyles({ contentWidth });
  let history = useHistory();

  async function login() {
    await server.login();
    history.go(0);
  }

  return (
    <>
      <CssBaseline />
      <AppBar position="absolute" className={classes.appBar}>
        <Toolbar>
          <Typography
            className={classes.title}
            variant="h6"
            color="inherit"
            noWrap
          >
            {title}
          </Typography>
          {showUser &&
            (server.get_user() ? (
              <IconButton
                color="inherit"
                onClick={(e) => history.push("/user")}
              >
                <AccountCircle />
              </IconButton>
            ) : (
              <Button color="inherit" onClick={login}>
                Login
              </Button>
            ))}
        </Toolbar>
      </AppBar>

      <main className={classes.layout}>
        {children && <Paper className={classes.paper}>{children}</Paper>}
        {showCopyright && <Copyright />}
      </main>
    </>
  );
}
