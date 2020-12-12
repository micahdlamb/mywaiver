import React, { useState, useEffect, useMemo } from "react";
import { useParams, useHistory } from "react-router-dom";
import {
  makeStyles,
  Grid,
  Paper,
  Button,
  TextField,
  Typography,
} from "@material-ui/core";
import * as pdf from "react-pdf";

import Page from "./Page";
import * as server from "./server";
import * as snackbar from "./snackbar";

const useStyles = makeStyles((theme) => ({
  paper: {
    margin: theme.spacing(2),
    padding: theme.spacing(2),
  },
  top: {
    textAlign: "center",
    margin: theme.spacing(2),
    "& > *": {
      width: "30ch",
    },
  },
}));

export default function Configure() {
  let classes = useStyles();
  let history = useHistory();
  let { template } = useParams();
  let tpl = useMemo(() => {
    let tpl = template
      ? server.get_template(template)
      : {
          name: "",
          pdf: null,
          config: {
            title: "My Waiver",
            reuseSubmission: "",
            emailTo: "",
            timestampFormat: "",
            steps: {
              Sign: {
                showPdf: true,
                fields: {
                  Signature: {
                    type: "signature",
                    position: null,
                    timestampPosition: null,
                  },
                },
              },
            },
          },
        };
    return { ...tpl, config: JSON.stringify(tpl.config, undefined, 2) };
  }, [template]);

  let [name, setName] = useState(tpl.name);
  let [pdf, setPdf] = useState(tpl.pdf);
  let [config, setConfig] = useState(tpl.config);

  async function save() {
    if (!pdf) return snackbar.error("Select PDF");
    try {
      var cfg = JSON.parse(config);
    } catch (error) {
      return snackbar.error("Invalid JSON");
    }

    if (pdf.dim) {
      cfg.pdfWidth = pdf.dim.width;
      cfg.pdfHeight = pdf.dim.height;
    }

    let secretName = name;
    if (!secretName.includes("__"))
      secretName += "__" + Math.random().toString(36).substr(2, 9);

    if (template) await server.update_template(template, secretName, pdf, cfg);
    else await server.create_template(secretName, pdf, cfg);

    snackbar.success("Saved!");
    history.go(-1);
  }

  return (
    <>
      <Page
        title={`Configure ${template || " New Waiver"}`}
        buttons={
          <Button color="inherit" onClick={save}>
            Save
          </Button>
        }
      />
      <Paper m={2} p={2} className={classes.paper}>
        <Grid container spacing={2}>
          <Grid item xs={12} lg={6}>
            <div className={classes.top}>
              <input
                type="file"
                id="select-pdf"
                accept="application/pdf"
                hidden
                onChange={(e) => setPdf(e.target.files[0] || pdf)}
              />
              <label htmlFor="select-pdf">
                <Button variant="contained" color="primary" component="span">
                  Select Pdf
                </Button>
              </label>
            </div>
            <Pdf file={pdf} />
          </Grid>
          <Grid item xs={12} lg={6}>
            <div className={classes.top}>
              <TextField
                label="URL"
                variant="outlined"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <TextField
              label="Config"
              variant="outlined"
              multiline
              fullWidth
              rows={40}
              value={config}
              onChange={(e) => setConfig(e.target.value)}
            />
          </Grid>
        </Grid>
      </Paper>
    </>
  );
}

const pdfStyles = makeStyles((theme) => ({
  center: {
    textAlign: "center",
    "& > *": {
      display: "inline-block",
      position: "relative",
      cursor: "crosshair",
      border: "1px solid #AAA",
      "& .drag-box": {
        position: "absolute",
        border: "1px solid #FF00FF",
        backgroundColor: "#FF00FF22",
      },
    },
  },
}));

function Pdf({ file }) {
  const classes = pdfStyles();
  let [coords, setCoords] = useState({});
  let [numPages, setNumPages] = useState(0);

  useEffect(() => {
    const container = document.querySelector(".react-pdf__Document");
    let start, end, div;

    function coords(e) {
      let r = container.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    }

    function box(append = 0) {
      let left = Math.round(Math.min(start[0], end[0])) + append;
      let top = Math.round(Math.min(start[1], end[1])) + append;
      let width = Math.abs(end[0] - start[0]) + append;
      let height = Math.abs(end[1] - start[1]) + append;
      return { left, top, width, height };
    }

    container.onmousedown = (e) => {
      start = end = coords(e);

      div = document.createElement("div");
      div.classList.add("drag-box");
      container.appendChild(div);
    };

    container.onmousemove = (e) => {
      if (!div) return;
      end = coords(e);

      Object.assign(div.style, box("px"));
    };

    document.onmouseup = (e) => {
      if (!div) return;
      div.remove();
      div = null;
      setCoords(box());
    };
  });

  function handleLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  function handleRenderSuccess() {
    const container = document.querySelector(".react-pdf__Document");
    if (file instanceof File)
      file.dim = {
        width: container.clientWidth,
        height: container.clientHeight,
      };
  }

  return (
    <>
      <div className={classes.center}>
        <pdf.Document file={file} onLoadSuccess={handleLoadSuccess}>
          {[...Array(numPages).keys()].map((pageNumber) => (
            <pdf.Page
              key={pageNumber}
              pageNumber={pageNumber + 1}
              renderTextLayer={false}
              onRenderSuccess={handleRenderSuccess}
            />
          ))}
        </pdf.Document>
      </div>
      <Typography align="center" color="primary" gutterBottom>
        {JSON.stringify(coords)}
      </Typography>
    </>
  );
}
