// https://github.com/mui-org/material-ui/tree/master/docs/src/pages/getting-started/templates/checkout
import React from "react";
import { useHistory, Link as RouterLink } from "react-router-dom";
import {
  makeStyles,
  fade,
  AppBar as MuiAppBar,
  Toolbar,
  Paper,
  Link,
  Typography,
  Button,
  IconButton,
  InputBase,
} from "@material-ui/core";
import AccountCircle from "@material-ui/icons/AccountCircle";
import AssignmentIcon from "@material-ui/icons/Assignment";
import SearchIcon from "@material-ui/icons/Search";

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

export function AppBar({ title, showUser, showLinks, buttons, onSearch }) {
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
        {onSearch && <SearchInput onSearch={onSearch} />}
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

const useSearchInputStyles = makeStyles((theme) => ({
  search: {
    position: "relative",
    borderRadius: theme.shape.borderRadius,
    backgroundColor: fade(theme.palette.common.white, 0.15),
    "&:hover": {
      backgroundColor: fade(theme.palette.common.white, 0.25),
    },
    marginLeft: theme.spacing(1),
  },
  searchIcon: {
    padding: theme.spacing(0, 2),
    height: "100%",
    position: "absolute",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  inputRoot: {
    color: "inherit",
  },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
    transition: theme.transitions.create("width"),
    width: "12ch",
    "&:focus": {
      width: "20ch",
    },
  },
}));

function SearchInput({ onSearch }) {
  let classes = useSearchInputStyles();

  function handleSubmit(e) {
    e.preventDefault();
    onSearch(e.target.search.value);
  }

  return (
    <form className={classes.search} onSubmit={handleSubmit}>
      <div className={classes.searchIcon}>
        <SearchIcon />
      </div>
      <InputBase
        placeholder="Search…"
        classes={{
          root: classes.inputRoot,
          input: classes.inputInput,
        }}
        inputProps={{ name: "search", "aria-label": "search" }}
      />
    </form>
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
