// https://github.com/mui-org/material-ui/tree/master/docs/src/pages/getting-started/templates/checkout
import React, { useState } from "react";
import { useParams } from "react-router-dom";
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
import SendIcon from "@material-ui/icons/Send";

import { Formik, Form, Field } from "formik";
import { TextField } from "formik-material-ui";
import ChipInput from "./ChipInput";

import Page from "./Page";
import SignatureInput from "./SignatureInput";
import ReuseSubmission from "./ReuseSubmission";
import PopulatedPdf, { populatePdf } from "./PopulatedPdf";

import * as server from "./server";
import * as snackbar from "./snackbar";

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
  let { template } = useParams();
  let [activeStep, setActiveStep] = useState(0);

  let config = server.get_template_config(template);
  let stepNames = Object.keys(config.steps);
  let isLastStep = activeStep === stepNames.length - 1;
  let step = Object.values(config.steps)[activeStep];

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  return (
    <Page title={config.title} contentWidth={600}>
      <Stepper activeStep={activeStep} className={classes.stepper}>
        {stepNames.map((name) => (
          <Step key={name}>
            <StepLabel>{name}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Formik
        initialValues={config.initialValues}
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
        onSubmit={async (values, { setTouched, setSubmitting, resetForm }) => {
          if (activeStep === stepNames.length - 1) {
            let keep = _.pickBy(values, (val) => !(val instanceof ArrayBuffer));
            let pdf = await populatePdf(template, config, values);
            await server.submit(template, pdf, keep);
            snackbar.success("Thank you for your submission!");
            resetForm();
            setActiveStep(0);
          } else {
            setActiveStep(activeStep + 1);
            setTouched({});
            setSubmitting(false);
          }
        }}
      >
        {({ submitForm, isSubmitting, values, errors, setValues }) => (
          <Form autoComplete="off">
            {config.reuseFields.map(
              (name) =>
                values[name] &&
                !errors[name] && (
                  <ReuseSubmission
                    key={name}
                    template={template}
                    field={name}
                    value={values[name]}
                    setValues={setValues}
                  />
                )
            )}
            <Grid container spacing={3}>
              {step.showPdf && (
                <Grid item xs={12}>
                  <PopulatedPdf
                    template={template}
                    config={config}
                    values={values}
                  />
                </Grid>
              )}
              {Object.entries(step.fields).map(([name, field]) => (
                <Grid item xs={12} key={name}>
                  {(field.type === "signature" && (
                    <SignatureInput name={name} label={field.label || name} />
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
                        multiline={field.multiline || undefined}
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
                endIcon={isLastStep ? <SendIcon /> : undefined}
              >
                {isLastStep ? "Accept" : "Next"}
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
