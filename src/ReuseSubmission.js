// https://github.com/mui-org/material-ui/tree/master/docs/src/pages/getting-started/templates/checkout
import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { withSize } from "react-sizeme";
import { Document, Page } from "react-pdf";
import {
  makeStyles,
  Dialog,
  Button,
  AppBar,
  Slide,
  Toolbar,
  LinearProgress,
  Typography,
} from "@material-ui/core";

import * as server from "./server";

const useStyles = makeStyles((theme) => ({
  appBar: {
    position: "relative",
  },
  title: {
    marginLeft: theme.spacing(2),
    flex: 1,
  },
  pdf: {
    overflowX: "hidden",
  },
}));

let to;

function ReuseSubmission({ waiver, field, value, size }) {
  console.log("render", value);
  const classes = useStyles();
  let history = useHistory();
  let [open, setOpen] = useState(false);
  let [numPages, setNumPages] = useState(0);

  useEffect(() => {
    clearTimeout(to);
    to = setTimeout(async () => {
      let submissions = await server.get_submissions(waiver, {
        [field]: value,
      });
      if (submissions.length) setOpen(submissions[0]);
    }, 100);
  }, [waiver, field, value]);

  if (open === undefined) return null;

  function handleLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  function close() {
    setOpen(false);
  }

  async function accept() {
    await server.record_use(waiver, open.id);
    window.enqueueSnackbar("Thank you for coming back!", {
      variant: "success",
    });
    setOpen(false);
    setTimeout(() => history.go(0), 5000);
  }

  return (
    <Dialog open={!!open} TransitionComponent={Transition} fullScreen>
      <AppBar className={classes.appBar}>
        <Toolbar>
          <Typography variant="h6" className={classes.title}>
            Is this Correct?
          </Typography>
          <Button autoFocus color="inherit" onClick={close}>
            Edit
          </Button>
          <Button autoFocus color="inherit" onClick={accept}>
            Accept
          </Button>
        </Toolbar>
      </AppBar>
      {open && (
        <Document
          file={`/${waiver}/${open.id}/download`}
          onLoadSuccess={handleLoadSuccess}
          loading={<LinearProgress />}
          className={classes.pdf}
        >
          {[...Array(numPages).keys()].map((pageNumber) => (
            <Page
              key={pageNumber}
              pageNumber={pageNumber + 1}
              width={size.width}
            />
          ))}
        </Document>
      )}
    </Dialog>
  );
}

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default withSize()(ReuseSubmission);
