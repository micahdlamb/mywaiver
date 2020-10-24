// https://github.com/mui-org/material-ui/tree/master/docs/src/pages/getting-started/templates/checkout
import React, { useState } from 'react';
import {
    makeStyles,
    Stepper,
    Step,
    StepLabel,
    Button,
    Typography,
    Grid,
    LinearProgress,
    MenuItem
} from '@material-ui/core';

import Page from './Page';

import { Formik, Form, Field } from 'formik';
import { TextField } from 'formik-material-ui';

import Pdf from './Pdf';

import config from './config.json';
let initialValues = Object.fromEntries(Object.values(config.steps).map(
    step => Object.entries(step.fields).map(
        ([name, field]) => [name, field.multiple ? [] : '']
    )
).flat())

const useStyles = makeStyles((theme) => ({
    stepper: {
        padding: theme.spacing(3, 0, 5),
    },
    buttons: {
        display: 'flex',
        justifyContent: 'flex-end',
    },
    button: {
        marginTop: theme.spacing(3),
        marginLeft: theme.spacing(1),
    },
}));

const typeToInput = {
    'string': TextField,
    'int': TextField,
    'date': TextField
}

export default function Waiver() {
    const classes = useStyles()
    let [activeStep, setActiveStep] = useState(0)

    let stepNames = Object.keys(config.steps).concat('Confirm')
    let name = stepNames[activeStep]
    let step = Object.values(config.steps)[activeStep]

    const handleNext = () => {
        setActiveStep(prevActiveStep => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep(prevActiveStep => prevActiveStep - 1);
    };

    const handleSubmit = values => {
        alert('submit')
    }

    return <Page title='Waiver' contentWidth={600}>
        <Stepper activeStep={activeStep} className={classes.stepper}>
            {stepNames.map(name =>
                <Step key={name}>
                    <StepLabel>{name}</StepLabel>
                </Step>
            )}
        </Stepper>

        <Formik
            initialValues={initialValues}
            validate={values => {
                const errors = {};
                for (let name of Object.keys(step.fields)) {
                    let value = values[name]
                    if (value.length === 0 || !value)
                        errors[name] = 'required'
                }

                return errors;
            }}
            onSubmit={async (values, { setSubmitting }) => {
                step ? handleNext() : await handleSubmit()
                setSubmitting(false);
            }}
        >
            {({ submitForm, isSubmitting }) =>
                <Form>
                    {step ?
                        <>
                            <Typography variant="h6" gutterBottom>
                                {name}
                            </Typography>
                            <Grid container spacing={3}>
                                {Object.entries(step.fields).map(([name, field]) =>
                                    <Grid item xs={12} key={name}>
                                        {field.type === 'enum' ?
                                            <Field
                                                component={TextField}
                                                select={true}
                                                SelectProps={{ multiple: field.multiple }}
                                                name={name}
                                                label={name}
                                                fullWidth
                                            >
                                                {field.options.map(option =>
                                                    <MenuItem key={option} value={option}>{option}</MenuItem>
                                                )}
                                            </Field>
                                            :
                                            <Field
                                                component={typeToInput[field.type]}
                                                multiple={field.multiple}
                                                name={name}
                                                label={name}
                                                fullWidth
                                            />
                                        }
                                    </Grid>
                                )}
                            </Grid>

                            {isSubmitting && <LinearProgress />}

                        </> :
                        <>
                            <Pdf file={'waiver.pdf'}/>
                            <Typography variant="h5" gutterBottom>
                                Thank you for your order.
                            </Typography>
                            <Typography variant="subtitle1">
                                Your order number is #2001539. We have emailed your order confirmation, and will
                                send you an update when your order has shipped.
                            </Typography>
                        </>
                    }

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
                        >
                            {step ? 'Next' : 'Confirm'}
                        </Button>
                    </div>
                </Form>
            }
        </Formik>
    </Page>
}