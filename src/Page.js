// https://github.com/mui-org/material-ui/tree/master/docs/src/pages/getting-started/templates/checkout
import React from "react";
import { useHistory, Link as RouterLink } from "react-router-dom";
import {
  makeStyles,
  AppBar as MuiAppBar,
  Toolbar,
  Paper,
  Link,
  Typography,
  Button,
  IconButton,
} from "@material-ui/core";
import AccountCircle from "@material-ui/icons/AccountCircle";
import AssignmentIcon from "@material-ui/icons/Assignment";

import * as server from "./server";

const useStyles = makeStyles((theme) => ({
  container: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },
  paper: {
    overflow: "hidden",
    maxWidth: (props) => props.contentWidth,
    margin: "auto",
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
    padding: theme.spacing(2),
    [theme.breakpoints.up("sm")]: {
      marginTop: theme.spacing(6),
      marginBottom: theme.spacing(6),
      padding: theme.spacing(3),
    },
  },
}));

export default function Page({
  contentWidth,
  showCopyright,
  children,
  ...appBarProps
}) {
  const classes = useStyles({ contentWidth });
  return (
    <>
      <AppBar {...appBarProps} />
      <main className={classes.container}>
        {children && <Paper className={classes.paper}>{children}</Paper>}
        {showCopyright && <Copyright />}
      </main>
    </>
  );
}

const useAppBarStyles = makeStyles((theme) => ({
  appBar: {
    position: "relative",
  },
  title: {
    flexGrow: 1,
  },
}));

export function AppBar({ title, showUser, showLinks, buttons }) {
  const classes = useAppBarStyles();
  let history = useHistory();

  async function login() {
    await server.login();
    history.push("/mywaivers");
  }

  return (
    <MuiAppBar position="absolute" className={classes.appBar}>
      <Toolbar>
        <Typography
          className={classes.title}
          variant="h6"
          color="inherit"
          noWrap
        >
          {title}
        </Typography>
        {buttons}
        {showUser &&
          (server.get_user() ? (
            <IconButton color="inherit" onClick={(e) => history.push("/user")}>
              <AccountCircle />
            </IconButton>
          ) : (
            <Button color="inherit" onClick={login}>
              Login
            </Button>
          ))}
        {showLinks && (
          <IconButton color="inherit" component={RouterLink} to="/mywaivers">
            <AssignmentIcon />
          </IconButton>
        )}
      </Toolbar>
    </MuiAppBar>
  );
}

export function Copyright() {
  return (
    <Typography variant="body2" color="textSecondary" align="center">
      {"Copyright © "}
      <Link color="inherit" href="/">
        My Waiver App
      </Link>{" "}
      {new Date().getFullYear()}
      {"."}
    </Typography>
  );
}
