import React, { useState, useMemo } from "react";
import { useParams, useHistory } from "react-router-dom";
import {
  makeStyles,
  Grid,
  Paper,
  IconButton,
  Button,
  TextField,
  MenuItem,
  InputAdornment,
  Popover,
  Typography,
  Tooltip,
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import DeleteIcon from "@material-ui/icons/Delete";
import VpnKeyIcon from "@material-ui/icons/VpnKey";
import HelpIcon from "@material-ui/icons/Help";

import _ from "lodash";
import { format } from "date-fns";
import * as pdf from "react-pdf";

import { Formik, Field, FieldArray, useFormikContext, getIn } from "formik";
import {
  TextField as TextField_,
  CheckboxWithLabel,
  Checkbox,
} from "formik-material-ui";
import ChipInput from "./ChipInput";

import { Rnd } from "react-rnd";

import { AppBar } from "./Page";
import WYSIWYGInput from "./WYSIWYGInput";
import * as server from "./server";
import * as snackbar from "./snackbar";

const useStyles = makeStyles((theme) => ({
  right: {
    backgroundColor: "white",
  },
  top: {
    textAlign: "center",
    margin: theme.spacing(3),
    "& > *": {
      width: "30ch",
    },
  },
  config: {
    margin: theme.spacing(2),
    "& .step": {
      backgroundColor: "#f5dbff",
      padding: theme.spacing(2),
    },
    "& .field": {
      backgroundColor: "#dffffd",
      padding: theme.spacing(2),
    },
    "& .space-between": {
      display: "flex",
      justifyContent: "space-between",
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
            emailTo: [],
            timestampFormat: timestampFormats[0],
            steps: {
              Contact: {
                showPdf: false,
                fields: {
                  email: {
                    label: "Email",
                    type: "email",
                    required: true,
                    reuse: true,
                  },
                },
              },
              Sign: {
                showPdf: true,
                fields: {
                  signature: {
                    label: "Signature",
                    type: "signature",
                    required: true,
                  },
                },
              },
            },
          },
        };
    return { ...tpl, config: objectToArray(tpl.config) };
  }, [template]);

  let [name, setName] = useState(tpl.name);
  let [pdf, setPdf] = useState(tpl.pdf);

  return (
    <Formik
      initialValues={tpl.config}
      validate={(values) => {
        const errors = {};

        if (!values.title) errors.title = "required";

        for (let [i, step] of values.steps.entries()) {
          if (!step.name) _.set(errors, `steps[${i}].name`, "required");
          for (let [j, field] of step.fields.entries())
            if (!field.name)
              _.set(errors, `steps[${i}].fields[${j}].name`, "required");
        }

        return errors;
      }}
      validateOnChange={false}
      onSubmit={async (cfg) => {
        // Clear out invalid values
        let inPdf = (pos) => pos && pos.left + pos.width > 0;
        for (let step of cfg.steps)
          for (let field of step.fields) {
            // null out positions outside the pdf so populatePdf ignores them
            if (!inPdf(field.position)) field.position = undefined;
            if (!inPdf(field.timestampPosition))
              field.timestampPosition = undefined;

            if (!reuseTypes.includes(field.type)) field.reuse = undefined;
          }

        cfg = arrayToObject(cfg);

        if (pdf.dim) {
          cfg.pdfWidth = pdf.dim.width;
          cfg.pdfHeight = pdf.dim.height;
        }

        let secretName = name.toLowerCase().replaceAll(" ", "_");
        if (!secretName.includes("__"))
          secretName += "__" + Math.random().toString(36).substr(2, 9);

        if (template)
          await server.update_template(template, secretName, pdf, cfg);
        else await server.create_template(secretName, pdf, cfg);

        snackbar.success("Saved!");
        history.go(-1);
      }}
    >
      {({ submitForm, values }) => (
        <>
          <AppBar
            title={`Configure ${template ? values.title : " New Waiver"}`}
          >
            <Button
              color="inherit"
              onClick={submitForm}
              disabled={!pdf || !values.steps.length}
            >
              Save
            </Button>
          </AppBar>
          <Grid container>
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
              {pdf && (
                <Typography component="div" variant="caption" align="center">
                  Drag signatures/fields into place{" "}
                  <Help size="small">
                    <ul>
                      <li>
                        Keep the signature draggable's aspect ratio similar to
                        the signature pad or it can appear stretched.
                      </li>
                      <li>
                        The inserted text height will match the draggable's
                        height.
                      </li>
                    </ul>
                  </Help>
                </Typography>
              )}
              <Pdf file={pdf} config={values} />
            </Grid>
            <Grid item xs={12} lg={6} className={classes.right}>
              <div className={classes.top}>
                <TextField
                  label="URL"
                  variant="outlined"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  helperText="Unique name for this template"
                />
              </div>
              <div className={classes.config}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Field
                      component={TextField_}
                      name="title"
                      label="Title"
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Field
                      component={ChipInput}
                      name="emailTo"
                      label="Email Signed Waivers To"
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <WYSIWYGInput
                      name="splashPage"
                      label="Splash Page"
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Field
                      select={true}
                      component={TextField_}
                      name="timestampFormat"
                      label="Signature Timestamp Format"
                      fullWidth
                    >
                      {timestampFormats.map((value) => (
                        <MenuItem value={value} key={value}>
                          {format(d, value)}
                        </MenuItem>
                      ))}
                    </Field>
                  </Grid>
                  <Grid item xs={12}>
                    <FieldArray
                      name="steps"
                      render={({ push, insert, remove }) => (
                        <Grid container spacing={2}>
                          <Grid item xs={12} className="space-between">
                            <Typography variant="h5">
                              Steps{" "}
                              <Help>
                                Each step is a set of related of fields that are
                                grouped together in the waiver. Typically you'll
                                show the pdf and collect signatures on the last
                                step.
                              </Help>
                            </Typography>
                            <IconButton
                              onClick={(e) => push(blankStep())}
                              color="primary"
                            >
                              <AddIcon />
                            </IconButton>
                          </Grid>
                          {values.steps.map((step, i) => (
                            <Grid item key={i} xs={12} md={6} lg={12}>
                              <Step
                                step={step}
                                path={`steps[${i}]`}
                                add={(e) => insert(i + 1, blankStep())}
                                remove={(e) => remove(i)}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      )}
                    />
                  </Grid>
                </Grid>
              </div>
            </Grid>
          </Grid>
        </>
      )}
    </Formik>
  );
}

let Step = ({ step, path, add, remove }) => (
  <Paper className="step">
    <Grid container spacing={2}>
      <Grid item xs={12} sm={8}>
        <Field
          component={TextField_}
          name={`${path}.name`}
          label="Step Name"
          fullWidth
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          component={CheckboxWithLabel}
          type="checkbox"
          name={`${path}.showPdf`}
          Label={{ label: "Show PDF" }}
          color="primary"
        />
      </Grid>
      <Grid item xs={12}>
        <FieldArray
          name={`${path}.fields`}
          render={({ push, insert, remove }) => (
            <Grid container spacing={2}>
              <Grid item xs={12} className="space-between">
                <Typography variant="h6">
                  Fields{" "}
                  <Help>
                    Information you want to collect. A simple waiver might
                    require a field for the user's email and signature. The
                    field's <b>name</b> is a unique identifier that you want to
                    avoid changing. The label is what actually gets displayed.
                  </Help>
                </Typography>
                <IconButton onClick={(e) => push(blankField())} color="primary">
                  <AddIcon />
                </IconButton>
              </Grid>

              {step.fields.map((field, i) => (
                <Grid item key={i} xs={12} sm={6}>
                  <ConfigField
                    field={field}
                    path={`${path}.fields[${i}]`}
                    add={(e) => insert(i + 1, blankField())}
                    remove={(e) => remove(i)}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        />
      </Grid>
      <Grid item xs={12} className="space-between">
        <IconButton onClick={remove}>
          <DeleteIcon />
        </IconButton>
        <IconButton onClick={add} color="primary">
          <AddIcon />
        </IconButton>
      </Grid>
    </Grid>
  </Paper>
);

let ConfigField = ({ field, path, add, remove }) => (
  <Paper className="field">
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Field
          component={TextField_}
          name={`${path}.name`}
          label="Field Name"
          fullWidth
          InputProps={
            (reuseTypes.includes(field.type) || null) && {
              endAdornment: (
                <Tooltip title="Prompt user to reuse a previously signed waiver. Typically used on an email or phone field.">
                  <InputAdornment position="end">
                    <Field
                      component={Checkbox}
                      type="checkbox"
                      name={`${path}.reuse`}
                      checkedIcon={<VpnKeyIcon />}
                    />
                  </InputAdornment>
                </Tooltip>
              ),
            }
          }
        />
      </Grid>
      <Grid item xs={2}></Grid>
      <Grid item xs={12}>
        <Field
          component={TextField_}
          name={`${path}.label`}
          label="Label"
          fullWidth
        />
      </Grid>
      <Grid item xs={12}>
        <Field
          select={true}
          component={TextField_}
          name={`${path}.type`}
          label="Type"
          fullWidth
        >
          {Object.entries(types).map(([value, label]) => (
            <MenuItem value={value} key={value}>
              {label}
            </MenuItem>
          ))}
        </Field>
      </Grid>
      {field.type === "select" && (
        <Grid item xs={12}>
          <Field
            component={ChipInput}
            name={`${path}.options`}
            label={"Options"}
            fullWidth
          />
        </Grid>
      )}
      <Grid item xs={6}>
        <Field
          component={CheckboxWithLabel}
          type="checkbox"
          name={`${path}.required`}
          Label={{ label: "Required" }}
          color="primary"
        />
      </Grid>
      {field.type === "text" && !field.multiline && (
        <Grid item xs={6}>
          <Field
            component={CheckboxWithLabel}
            type="checkbox"
            name={`${path}.multiple`}
            Label={{ label: "Multiple" }}
            color="primary"
          />
        </Grid>
      )}
      {field.type === "text" && !field.multiple && (
        <Grid item xs={6}>
          <Field
            component={CheckboxWithLabel}
            type="checkbox"
            name={`${path}.multiline`}
            Label={{ label: "Multiline" }}
            color="primary"
          />
        </Grid>
      )}
      {field.type === "text" && field.multiple && (
        <Grid item xs={6}>
          <Field
            component={CheckboxWithLabel}
            type="checkbox"
            name={`${path}.vertical`}
            Label={{ label: "Vertical" }}
            color="primary"
          />
        </Grid>
      )}
      <Grid item xs={12} className="space-between">
        <IconButton onClick={remove}>
          <DeleteIcon />
        </IconButton>
        <IconButton onClick={add} color="primary">
          <AddIcon />
        </IconButton>
      </Grid>
    </Grid>
  </Paper>
);

let timestampFormats = [
  "iii LLL d yyyy",
  "M/d/yy",
  "yyyy-MM-dd",
  "yyyy-MM-dd hh:mm:ss",
];

let d = new Date();

let types = {
  signature: "Signature",
  text: "Text",
  email: "Email",
  tel: "Phone #",
  select: "Select",
  number: "Number",
};

let reuseTypes = ["text", "email", "tel"];

let blankStep = () => ({
  name: "",
  showPdf: false,
  fields: [],
});

let blankField = () => ({
  name: "",
  label: "",
  reuse: false,
  type: "text",
  options: [],
  required: true,
  multiple: false,
  multiline: false,
  vertical: false,
});

let objectToArray = (config) => ({
  ...config,
  steps: Object.entries(config.steps).map(([name, step]) => ({
    ...step,
    name,
    fields: Object.entries(step.fields).map(([name, field]) => ({
      ...field,
      name,
    })),
  })),
});

let arrayToObject = (config) => ({
  ...config,
  steps: Object.fromEntries(
    config.steps.map(({ name, ...step }) => [
      name,
      {
        ...step,
        fields: Object.fromEntries(
          step.fields.map(({ name, ...field }) => [name, field])
        ),
      },
    ])
  ),
});

///////////////////////////////////////////////////////////////////////////////////////////////////

const pdfStyles = makeStyles((theme) => ({
  center: {
    textAlign: "center",
    "& > *": {
      display: "inline-block",
      position: "relative",
      border: "1px solid #AAA",
    },
  },
  stamp: {
    border: "1px solid #AFA",
    backgroundColor: "#AFA6",
    color: "blue",
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "60%",
  },
}));

function Pdf({ file, config }) {
  const classes = pdfStyles();
  let { values, setFieldValue } = useFormikContext();
  let [numPages, setNumPages] = useState(0);

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

  let stamps = [...getStamps(config)];

  function Stamp(stamp, i) {
    let [name, path] = stamp;

    let value = getIn(values, path) || {
      left: -105,
      top: i * 25,
      width: 100,
      height: 20,
    };

    let position = { ...value, x: value.left, y: value.top };

    let handleDragStop = (e, { x, y }) => {
      let newValue = {
        ...value,
        left: x,
        top: y,
      };
      setFieldValue(path, newValue);
    };

    let handleResizeStop = (e, direction, ref, delta, { x, y }) => {
      let newValue = {
        width: parseInt(ref.style.width, 10),
        height: parseInt(ref.style.height, 10),
        left: x,
        top: y,
      };
      setFieldValue(path, newValue);
    };

    return (
      <Rnd
        key={i}
        position={position}
        size={position}
        onDragStop={handleDragStop}
        onResizeStop={handleResizeStop}
        minWidth={4}
        minHeight={4}
      >
        <div className={classes.stamp}>{name}</div>
      </Rnd>
    );
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
          {stamps.map(Stamp)}
        </pdf.Document>
      </div>
    </>
  );
}

function* getStamps(config) {
  for (let [i, step] of config.steps.entries())
    for (let [j, field] of step.fields.entries())
      if (field.name) {
        let path = `steps[${i}].fields[${j}]`;
        yield [field.name, `${path}.position`];
        if (field.type === "signature")
          yield [`${field.name}-TS`, `${path}.timestampPosition`];
      }
}

///////////////////////////////////////////////////////////////////////////////////////////////////

const useHelpStyles = makeStyles((theme) => ({
  typography: {
    padding: theme.spacing(2),
    maxWidth: 400,
  },
}));

function Help({ children, ...props }) {
  const classes = useHelpStyles();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "help-popover" : undefined;

  return (
    <>
      <IconButton
        aria-describedby={id}
        variant="contained"
        color="primary"
        onClick={handleClick}
        {...props}
      >
        <HelpIcon />
      </IconButton>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <Typography className={classes.typography} component="div">
          {children}
        </Typography>
      </Popover>
    </>
  );
}
