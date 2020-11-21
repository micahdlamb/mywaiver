// https://github.com/mui-org/material-ui/tree/master/docs/src/pages/getting-started/templates/checkout
import React, { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
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
    await server.submit_waiver(waiver, await populatePdf(config, values));
    window.enqueueSnackbar("Thank you for your submission!", {
      variant: "success",
    });
    setTimeout(() => window.location.reload(), 5000);
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
          for (let name of Object.keys(step.fields)) {
            let value = values[name];
            if (!value || value.length === 0) errors[name] = "required";
          }

          return errors;
        }}
        onSubmit={async (values, { setTouched, setSubmitting }) => {
          await handleNext(values);
          setTouched({});
          setSubmitting(false);
        }}
      >
        {({ submitForm, isSubmitting, values }) => (
          <Form>
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
                        label={name}
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
                        label={name}
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
