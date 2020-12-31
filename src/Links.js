// https://github.com/mui-org/material-ui/tree/master/docs/src/pages/getting-started/templates/checkout
import React from "react";
import { Link as RouterLink, Redirect } from "react-router-dom";
import {
  makeStyles,
  Typography,
  List,
  ListItem,
  ListItemSecondaryAction,
  Link,
  ButtonGroup,
  Button,
  IconButton,
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import HistoryIcon from "@material-ui/icons/History";
import BarChartIcon from "@material-ui/icons/BarChart";
import SettingsIcon from "@material-ui/icons/Settings";

import Page from "./Page";
import * as server from "./server";

export function MyWaivers() {
  let user = server.get_user();
  if (!user) return <Redirect to="/demos" />;

  let templates = server.get_my_template_names();

  return (
    <Page title="My Waivers" contentWidth={400} showUser showCopyright>
      <Typography align="right">
        <Button
          color="primary"
          startIcon={<AddIcon />}
          component={RouterLink}
          to="/configure/new"
        >
          Create
        </Button>
      </Typography>
      <Links templates={templates} />
      {!templates.length && (
        <Typography align="center" color="textSecondary">
          No waivers setup for {user}
        </Typography>
      )}
    </Page>
  );
}

export function DemoWaivers() {
  let templates = server.get_demo_template_names();

  return (
    <Page title="Demo Waivers" contentWidth={400} showUser showCopyright>
      <Links templates={templates} />
    </Page>
  );
}

const useStyles = makeStyles((theme) => ({
  root: {
    "& a.MuiLink-root": {
      flex: 1,
    },
  },
}));

function Links({ templates }) {
  let classes = useStyles();

  return (
    <List component="nav" className={classes.root}>
      {templates.map(([template, title]) => (
        <ListItem button key={template}>
          <Link component={RouterLink} to={`/${template}`}>
            {title}
          </Link>
          <ListItemSecondaryAction>
            <ButtonGroup>
              <IconButton
                color="primary"
                component={RouterLink}
                to={`/${template}/submissions`}
              >
                <HistoryIcon />
              </IconButton>
              <IconButton
                color="secondary"
                component={RouterLink}
                to={`/${template}/usage`}
              >
                <BarChartIcon />
              </IconButton>
              <IconButton component={RouterLink} to={`/${template}/configure`}>
                <SettingsIcon />
              </IconButton>
            </ButtonGroup>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );
}
