import * as React from "react";
import MuiChipInput from "material-ui-chip-input";
import { getIn } from "formik";

export function fieldToChipInput({
  disabled,
  field,
  form: { isSubmitting, touched, errors, setFieldValue },
  helperText,
  ...props
}) {
  const fieldError = getIn(errors, field.name);
  const showError = getIn(touched, field.name) && !!fieldError;

  delete field.onChange;

  function handleAdd(item) {
    setFieldValue(field.name, field.value.concat(item));
  }

  function handleDelete(item, idx) {
    let newValue = field.value.filter((val, i) => idx !== i);
    setFieldValue(field.name, newValue);
  }

  return {
    onAdd: handleAdd,
    onDelete: handleDelete,
    variant: props.variant,
    error: showError,
    helperText: showError ? fieldError : helperText,
    disabled: disabled ?? isSubmitting,
    id: field.name, // or onBlur doesn't work
    ...field,
    ...props,
  };
}

export default function ChipInput({ children, ...props }) {
  return <MuiChipInput {...fieldToChipInput(props)}>{children}</MuiChipInput>;
}
