// https://github.com/mui-org/material-ui/tree/master/docs/src/pages/getting-started/templates/checkout
import React from "react";
import { Link as RouterLink, Redirect } from "react-router-dom";
import {
  makeStyles,
  Typography,
  List,
  ListItem,
  Link,
  Button,
  IconButton,
  Box,
  Divider,
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
      {templates.length ? (
        <>
          <Links templates={templates} />
          <Divider />
          <Box p={2}>
            <Typography variant="caption">
              Bookmark the waiver url on your signing tablet.
            </Typography>
          </Box>
        </>
      ) : (
        <Typography align="center" color="textSecondary">
          No waivers setup
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
  // Similar to ListItemSecondaryAction
  buttons: {
    position: "absolute",
    top: "50%",
    right: 0,
    transform: "translateY(-50%)",
  },
}));

function Links({ templates }) {
  let classes = useStyles();

  return (
    <List component="nav" className={classes.root}>
      {templates.map(([template, title]) => (
        <ListItem key={template}>
          <Link component={RouterLink} to={`/${template}`}>
            {title}
          </Link>
          <div className={classes.buttons}>
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
          </div>
        </ListItem>
      ))}
    </List>
  );
}
