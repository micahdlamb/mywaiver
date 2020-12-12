import React from "react";
import { SnackbarProvider, useSnackbar } from "notistack";

export function Provider({ children }) {
  return (
    <SnackbarProvider>
      <MakeGlobal />
      {children}
    </SnackbarProvider>
  );
}

function MakeGlobal() {
  const { enqueueSnackbar } = useSnackbar();
  window.enqueueSnackbar = enqueueSnackbar;
  return null;
}

export function success(message) {
  window.enqueueSnackbar(message, {
    variant: "success",
  });
}

export function error(message) {
  window.enqueueSnackbar(message, {
    variant: "error",
  });
}
