// https://github.com/mui-org/material-ui/tree/master/docs/src/pages/getting-started/templates/checkout
import React, { useState } from "react";
import PropTypes from "prop-types";
import { Link as RouterLink } from "react-router-dom";
import SwipeableViews from "react-swipeable-views";
import { useTheme, Typography, Box, Tabs, Tab, Link } from "@material-ui/core";
import CreateIcon from "@material-ui/icons/Create";
import HelpIcon from "@material-ui/icons/Help";
import AssignmentTurnedInIcon from "@material-ui/icons/AssignmentTurnedIn";

import Page from "./Page";

export default function LandingPage() {
  const theme = useTheme();
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleChangeIndex = (index) => {
    setValue(index);
  };

  return (
    <>
      <Page
        title="My Waiver App"
        contentWidth={600}
        showUser
        showLinks
        showCopyright
      >
        <Tabs
          value={value}
          onChange={handleChange}
          indicatorColor="secondary"
          textColor="secondary"
          centered
        >
          <Tab icon={<CreateIcon />} label="WHAT" {...a11yProps(0)} />
          <Tab icon={<HelpIcon />} label="WHY" {...a11yProps(1)} />
          <Tab
            icon={<AssignmentTurnedInIcon />}
            label="HOW"
            {...a11yProps(2)}
          />
        </Tabs>
        <SwipeableViews
          axis={theme.direction === "rtl" ? "x-reverse" : "x"}
          index={value}
          onChangeIndex={handleChangeIndex}
        >
          <TabPanel value={value} index={0} dir={theme.direction}>
            Stop wasting paper and start using My Waiver App to e-sign and store your
            waivers. You can see a demo of signing a waiver{" "}
            <Link component={RouterLink} to="/bounce_house__d7shgy09j">
              here.
            </Link>
          </TabPanel>
          <TabPanel value={value} index={1} dir={theme.direction}>
            Other electric waiver signing apps are way too expensive! MyWaiver
            is dedicated to keeping the cost per waiver the cheapest of all
            competitors.
          </TabPanel>
          <TabPanel value={value} index={2} dir={theme.direction}>
            Setup is simple using an existing pdf. Signature positions are
            configured by dragging them into place. You can get started by
            logging in and clicking <b>CREATE</b>. Example waivers and their
            setup are available{" "}
            <Link component={RouterLink} to="/demos">
              here.
            </Link>
          </TabPanel>
        </SwipeableViews>
      </Page>
    </>
  );
}

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box p={3}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired,
};

function a11yProps(index) {
  return {
    id: `full-width-tab-${index}`,
    "aria-controls": `full-width-tabpanel-${index}`,
  };
}
