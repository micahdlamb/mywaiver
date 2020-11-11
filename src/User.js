// https://github.com/mui-org/material-ui/tree/master/docs/src/pages/getting-started/templates/checkout
import React from "react";
import { useHistory } from "react-router-dom";
import { makeStyles, List, ListItem, ListItemText, ListItemIcon } from "@material-ui/core";
import MeetingRoomIcon from '@material-ui/icons/MeetingRoom';

import Page from "./Page";
import * as server from "./server";

const useStyles = makeStyles((theme) => ({
  root: {},
}));

export default function Links() {
  let classes = useStyles();
  let history = useHistory();
  let user = server.get_user();

  async function logout() {
    await server.logout();
    window.enqueueSnackbar("Logged out", { variant: "success" });
    history.push("/");
  }

  return (
    <Page title={user} contentWidth={400}>
      <List component="nav" className={classes.root}>
        <ListItem button onClick={logout}>
          <ListItemIcon>
            <MeetingRoomIcon color="secondary"/>
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Page>
  );
}
