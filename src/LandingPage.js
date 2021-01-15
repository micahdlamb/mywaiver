// https://github.com/mui-org/material-ui/tree/master/docs/src/pages/getting-started/templates/checkout
import React, { useState } from "react";
import PropTypes from "prop-types";
import { Link as RouterLink } from "react-router-dom";
import SwipeableViews from "react-swipeable-views";
import { useTheme, Typography, Box, Tabs, Tab, Link } from "@material-ui/core";
import HelpIcon from "@material-ui/icons/Help";
import MonetizationOnIcon from "@material-ui/icons/MonetizationOn";
import AssignmentTurnedInIcon from "@material-ui/icons/AssignmentTurnedIn";
import SettingsIcon from "@material-ui/icons/Settings";

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
          <Tab icon={<HelpIcon />} label="WHAT IS THIS?" {...a11yProps(0)} />
          <Tab
            icon={<MonetizationOnIcon />}
            label="PRICING"
            {...a11yProps(1)}
          />
          <Tab
            icon={<AssignmentTurnedInIcon />}
            label="GET STARTED"
            {...a11yProps(2)}
          />
        </Tabs>
        <SwipeableViews
          axis={theme.direction === "rtl" ? "x-reverse" : "x"}
          index={value}
          onChangeIndex={handleChangeIndex}
        >
          <TabPanel value={value} index={0} dir={theme.direction}>
            <p>Easily turn your pdf into an e-signable waiver.</p>
            <p>Use any mobile device as a waiver signing station.</p>
            <p>
              Signed waivers are securely stored and can be easily looked up
              should the need arise.
            </p>
            <p>
              You can see a demo of signing a waiver{" "}
              <Link component={RouterLink} to="/bounce_house__d7shgy09j">
                here.
              </Link>
            </p>
            <p>
              This site is under active development. Reach out to
              micah.d.lamb@gmail.com for questions and feature requests.
            </p>
          </TabPanel>
          <TabPanel value={value} index={1} dir={theme.direction}>
            <p>Other waiver signing apps are way too expensive!</p>
            <p>
              You're first month is free. After that you'll pay $5 a month + 2
              cents per waiver signed.
            </p>
            <p>
              You're waivers will be stored as long as you continue with the
              service. If you leave you'll have 6 months to download them.
            </p>
          </TabPanel>
          <TabPanel value={value} index={2} dir={theme.direction}>
            Setup is simple using an existing pdf. You can get started by
            logging in with a google account and clicking <b>CREATE</b> to setup
            your first waiver.
            <p>
              Checkout some example waivers{" "}
              <Link component={RouterLink} to="/demos">
                here.
              </Link>{" "}
              Click <SettingsIcon /> to see their configuration.
            </p>
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
          <Typography component="div">{children}</Typography>
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
