// https://github.com/mui-org/material-ui/tree/master/docs/src/pages/getting-started/templates/checkout
import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  makeStyles,
  Typography,
  List,
  ListItem,
  ListItemSecondaryAction,
  Link,
  IconButton,
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import HistoryIcon from "@material-ui/icons/History";
import SettingsIcon from "@material-ui/icons/Settings";

import Page from "./Page";
import * as server from "./server";

const useStyles = makeStyles((theme) => ({
  root: {
    "& a.MuiLink-root": {
      flex: 1,
    },
  },
  configure: {
    right: "50px",
  },
}));

export default function Links() {
  let classes = useStyles();
  let templates = server.get_template_names();
  let user = server.get_user();

  return (
    <Page title="Choose Waiver" contentWidth={400} showUser showCopyright>
      {user ? (
        <Typography align="right">
          <RouterLink to={`/configure/new`}>
            <IconButton edge="end" aria-label="submissions" color="primary">
              <AddIcon />
            </IconButton>
          </RouterLink>
        </Typography>
      ) : (
        <Typography variant="h3">Demo</Typography>
      )}
      <List component="nav" className={classes.root}>
        {templates.map((template) => (
          <ListItem button key={template}>
            <Link component={RouterLink} to={`/${template}`}>
              {template}
            </Link>
            <ListItemSecondaryAction className={classes.configure}>
              <RouterLink to={`/${template}/configure`}>
                <IconButton edge="end" aria-label="configure">
                  <SettingsIcon />
                </IconButton>
              </RouterLink>
            </ListItemSecondaryAction>
            <ListItemSecondaryAction>
              <RouterLink to={`/${template}/submissions`}>
                <IconButton edge="end" aria-label="submissions" color="primary">
                  <HistoryIcon />
                </IconButton>
              </RouterLink>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
        {!templates.length && (
          <Typography align="center" color="textSecondary">
            No waivers setup for {user}
          </Typography>
        )}
      </List>
    </Page>
  );
}
