// https://github.com/mui-org/material-ui/tree/master/docs/src/pages/getting-started/templates/checkout
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import _ from "lodash";
import { withSize } from "react-sizeme";
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
import { renderDraftJSContent } from "./WYSIWYGInput";
import ReuseSubmission from "./ReuseSubmission";
import PopulatedPdf, { populatePdf } from "./PopulatedPdf";

import * as server from "./server";
import * as snackbar from "./snackbar";

const useStyles = makeStyles((theme) => ({
  splash: {
    "& img": {
      maxWidth: "100%",
    },
  },
  stepper: {
    padding: theme.spacing(3, 0, 5),
  },
  buttons: {
    display: "flex",
    justifyContent: "flex-end",
    "& > button": {
      marginLeft: theme.spacing(1),
    },
  },
}));

export default function Waiver() {
  const classes = useStyles();
  let { template } = useParams();
  let config = server.get_template_config(template);

  let firstStep = config.splashPage ? -1 : 0;
  let [activeStep, setActiveStep] = useState(firstStep);
  let stepNames = Object.keys(config.steps);
  let isLastStep = activeStep === stepNames.length - 1;
  let step = Object.values(config.steps)[activeStep];

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  if (activeStep === -1)
    return (
      <Page title={config.title} contentWidth={600}>
        <Grid container spacing={3} className={classes.splash}>
          <Grid item xs={12}>
            {renderDraftJSContent(config.splashPage)}
          </Grid>
        </Grid>
        <Grid item xs={12} className={classes.buttons}>
          <Button
            variant="contained"
            color="primary"
            onClick={(e) => setActiveStep(0)}
          >
            Begin
          </Button>
        </Grid>
        <div />
      </Page>
    );

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
            setActiveStep(firstStep);
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
            <WithSize>
              {(size) => (
                <Grid container spacing={3}>
                  {step.showPdf && (
                    <Grid item xs={12}>
                      <PopulatedPdf
                        template={template}
                        config={config}
                        values={values}
                        width={size.width}
                      />
                    </Grid>
                  )}
                  {Object.entries(step.fields).map(([name, field]) => (
                    <Grid item xs={12} key={name}>
                      {(field.type === "signature" && (
                        <SignatureInput
                          name={name}
                          label={field.label || name}
                        />
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
                  <Grid item xs={12} className={classes.buttons}>
                    {activeStep !== 0 && (
                      <Button onClick={handleBack}>Back</Button>
                    )}
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={submitForm}
                      disabled={isSubmitting}
                      endIcon={isLastStep ? <SendIcon /> : undefined}
                    >
                      {isLastStep ? "Accept" : "Next"}
                    </Button>
                  </Grid>
                </Grid>
              )}
            </WithSize>
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

const WithSize = withSize()(({ size, children }) => (
  <div>{children(size)}</div>
));
