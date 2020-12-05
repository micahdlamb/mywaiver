// https://github.com/mui-org/material-ui/tree/master/docs/src/pages/getting-started/templates/checkout
import React, { useState, useMemo } from "react";
import { useParams, useHistory } from "react-router-dom";
import _ from "lodash";
import {
  makeStyles,
  Stepper,
  Step,
  StepLabel,
  Button,
  Grid,
  Box,
  LinearProgress,
  MenuItem,
} from "@material-ui/core";

import { Formik, Form, Field } from "formik";
import { TextField } from "formik-material-ui";
import ChipInput from "./ChipInput";

import Page from "./Page";
import SignatureInput from "./SignatureInput";
import ReuseSubmission from "./ReuseSubmission";
import PopulatedPdf, { populatePdf } from "./PopulatedPdf";

import * as server from "./server";

const useStyles = makeStyles((theme) => ({
  stepper: {
    padding: theme.spacing(3, 0, 5),
  },
  buttons: {
    display: "flex",
    justifyContent: "flex-end",
  },
  button: {
    marginTop: theme.spacing(3),
    marginLeft: theme.spacing(1),
  },
}));

export default function Waiver() {
  const classes = useStyles();
  let history = useHistory();
  let { waiver } = useParams();
  let [activeStep, setActiveStep] = useState(0);

  let config = server.get_config(waiver);
  let initialValues = useMemo(
    () =>
      Object.fromEntries(
        Object.values(config.steps)
          .map((step) =>
            Object.entries(step.fields).map(([name, field]) => [
              name,
              field.multiple ? [] : "",
            ])
          )
          .flat()
      ),
    [config]
  );

  let stepNames = Object.keys(config.steps);
  let step = Object.values(config.steps)[activeStep];

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const handleNext = async (values) => {
    if (activeStep === stepNames.length - 1) await handleSubmit(values);
    else setActiveStep(activeStep + 1);
  };

  const handleSubmit = async (values) => {
    let keep = _.pickBy(values, (val) => !(val instanceof ArrayBuffer));
    await server.submit_waiver(waiver, await populatePdf(config, values), keep);
    window.enqueueSnackbar("Thank you for your submission!", {
      variant: "success",
    });
    setTimeout(() => history.go(0), 5000);
  };

  return (
    <Page title={config.name} contentWidth={600}>
      <Stepper activeStep={activeStep} className={classes.stepper}>
        {stepNames.map((name) => (
          <Step key={name}>
            <StepLabel>{name}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Formik
        initialValues={initialValues}
        validate={(values) => {
          const errors = {};
          for (let [name, field] of Object.entries(step.fields)) {
            let value = values[name];
            let empty = !value || value.length === 0;
            if (empty && !field.required) continue;
            if (empty) errors[name] = "required";
            else if (
              field.type === "email" &&
              !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)
            )
              errors[name] = "invalid email";
            else if (field.type === "tel" && !/^\d{10,11}$/.test(value))
              errors[name] = "invalid phone";
          }

          return errors;
        }}
        onSubmit={async (values, { setTouched, setSubmitting }) => {
          await handleNext(values);
          setTouched({});
          setSubmitting(false);
        }}
      >
        {({ submitForm, isSubmitting, values, errors }) => (
          <Form>
            {config.reuseSubmission &&
              config.reuseSubmission
                .split(" ")
                .map(
                  (field) =>
                    values[field] &&
                    !errors[field] && (
                      <ReuseSubmission
                        key={field}
                        waiver={waiver}
                        field={field}
                        value={values[field]}
                      />
                    )
                )}
            <Grid container spacing={3}>
              {step.showPdf && (
                <Grid item xs={12}>
                  <PopulatedPdf config={config} values={values} />
                </Grid>
              )}
              {Object.entries(step.fields).map(([name, field]) => (
                <Grid item xs={12} key={name}>
                  {(field.type === "signature" && (
                    <SignatureInput name={name} label={name} />
                  )) ||
                    (field.type === "select" && (
                      <Field
                        component={TextField}
                        select={true}
                        SelectProps={{ multiple: field.multiple }}
                        name={name}
                        label={field.label || name}
                        fullWidth
                      >
                        {field.options.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </Field>
                    )) || (
                      <Field
                        component={field.multiple ? ChipInput : TextField}
                        type={field.type}
                        multiline={field.multiline}
                        name={name}
                        label={field.label || name}
                        fullWidth
                      />
                    )}
                </Grid>
              ))}
            </Grid>

            <div className={classes.buttons}>
              {activeStep !== 0 && (
                <Button onClick={handleBack} className={classes.button}>
                  Back
                </Button>
              )}
              <Button
                variant="contained"
                color="primary"
                onClick={submitForm}
                className={classes.button}
                disabled={isSubmitting}
              >
                {activeStep !== stepNames.length - 1 ? "Next" : "Submit"}
              </Button>
            </div>

            {isSubmitting && (
              <Box m={1}>
                <LinearProgress />
              </Box>
            )}
          </Form>
        )}
      </Formik>
    </Page>
  );
}
