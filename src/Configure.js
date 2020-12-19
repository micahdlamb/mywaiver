import React, { useState, useMemo } from "react";
import { useParams, useHistory } from "react-router-dom";
import {
  makeStyles,
  Grid,
  Paper,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  IconButton,
  Button,
  TextField,
  MenuItem,
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import DeleteIcon from "@material-ui/icons/Delete";
import * as pdf from "react-pdf";

import { Formik, Field, FieldArray, useFormikContext, getIn } from "formik";
import { TextField as TextField_, CheckboxWithLabel } from "formik-material-ui";
import ChipInput from "./ChipInput";

import { Rnd } from "react-rnd";

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
  config: {
    "& .MuiPaper-root": {
      backgroundColor: "white",
      "& .MuiPaper-root": {
        backgroundColor: "#EEF",
        "& .MuiPaper-root": {
          backgroundColor: "white",
          "& .MuiPaper-root": {
            backgroundColor: "#EFE",
          },
        },
      },
    },
    "& .space-between": {
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
            emailTo: "",
            timestampFormat: "",
            steps: {},
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
        return errors;
      }}
      onSubmit={async (cfg, { setTouched, setSubmitting, resetForm }) => {
        cfg = arrayToObject(cfg);

        if (pdf.dim) {
          cfg.pdfWidth = pdf.dim.width;
          cfg.pdfHeight = pdf.dim.height;
        }

        let secretName = name;
        if (!secretName.includes("__"))
          secretName += "__" + Math.random().toString(36).substr(2, 9);

        if (template)
          await server.update_template(template, secretName, pdf, cfg);
        else await server.create_template(secretName, pdf, cfg);

        snackbar.success("Saved!");
        history.go(-1);
      }}
    >
      {({ submitForm, isSubmitting, values, errors }) => (
        <>
          <Page
            title={`Configure ${template || " New Waiver"}`}
            buttons={
              <Button color="inherit" onClick={submitForm}>
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
                    <Button
                      variant="contained"
                      color="primary"
                      component="span"
                    >
                      Select Pdf
                    </Button>
                  </label>
                </div>
                <Pdf file={pdf} config={values} />
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
                        component={TextField_}
                        name="reuseSubmission"
                        label="Reuse Submission"
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Field
                        component={TextField_}
                        name="emailTo"
                        label="Email To"
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Field
                        component={TextField_}
                        name="timestampFormat"
                        label="Timestamp Format"
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FieldArray
                        name="steps"
                        render={({ push, insert, remove }) => (
                          <Card variant="outlined">
                            <CardHeader
                              title="Steps"
                              action={
                                <IconButton
                                  onClick={(e) => push(blankStep())}
                                  color="primary"
                                >
                                  <AddIcon />
                                </IconButton>
                              }
                            />
                            <CardContent>
                              <Grid container spacing={2}>
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
                            </CardContent>
                          </Card>
                        )}
                      />
                    </Grid>
                  </Grid>
                </div>
              </Grid>
            </Grid>
          </Paper>
        </>
      )}
    </Formik>
  );
}

let Step = ({ step, path, add, remove }) => (
  <Card variant="outlined" square>
    <CardContent>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Field
            component={TextField_}
            name={`${path}.name`}
            label="Name"
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
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
              <Card variant="outlined">
                <CardHeader
                  title="Fields"
                  action={
                    <IconButton
                      onClick={(e) => push(blankField())}
                      color="primary"
                    >
                      <AddIcon />
                    </IconButton>
                  }
                />
                <CardContent>
                  <Grid container spacing={2}>
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
                </CardContent>
              </Card>
            )}
          />
        </Grid>
      </Grid>
    </CardContent>
    <CardActions className="space-between">
      <IconButton onClick={remove}>
        <DeleteIcon />
      </IconButton>
      <IconButton onClick={add} color="primary">
        <AddIcon />
      </IconButton>
    </CardActions>
  </Card>
);

let ConfigField = ({ field, path, add, remove }) => (
  <Card variant="outlined" square>
    <CardContent>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Field
            component={TextField_}
            name={`${path}.name`}
            label="Name"
            fullWidth
          />
        </Grid>
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
            <MenuItem value="signature">Signature</MenuItem>
            <MenuItem value="select">Select</MenuItem>
            <MenuItem value="text">Text</MenuItem>
            <MenuItem value="email">Email</MenuItem>
            <MenuItem value="tel">Phone #</MenuItem>
            <MenuItem value="number">Number</MenuItem>
          </Field>
        </Grid>
        {field.type === "select" && (
          <Grid item xs={12}>
            <Field
              component={ChipInput}
              name={"options"}
              label={"Options"}
              fullWidth
            />
          </Grid>
        )}
        <Grid item xs={4}>
          <Field
            component={CheckboxWithLabel}
            type="checkbox"
            name={`${path}.required`}
            Label={{ label: "Required" }}
            color="primary"
          />
        </Grid>
        <Grid item xs={4}>
          <Field
            component={CheckboxWithLabel}
            type="checkbox"
            name={`${path}.multiple`}
            Label={{ label: "Multiple" }}
            disabled={field.multiline}
            color="primary"
          />
        </Grid>
        <Grid item xs={4}>
          <Field
            component={CheckboxWithLabel}
            type="checkbox"
            name={`${path}.multiline`}
            Label={{ label: "Multiline" }}
            disabled={field.multiple}
            color="primary"
          />
        </Grid>
      </Grid>
    </CardContent>
    <CardActions className="space-between">
      <IconButton onClick={remove}>
        <DeleteIcon />
      </IconButton>
      <IconButton onClick={add} color="primary">
        <AddIcon />
      </IconButton>
    </CardActions>
  </Card>
);

let blankStep = () => ({
  name: "",
  showPdf: false,
  fields: [],
});

let blankField = () => ({
  name: "",
  label: "",
  type: "text",
  options: [],
  required: true,
  multiple: false,
  multiline: false,
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
      left: -95,
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
