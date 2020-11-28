import React, { Suspense } from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { SnackbarProvider, useSnackbar } from "notistack";

import Page from "./Page";
import User from "./User";
import Links from "./Links";
import Waiver from "./Waiver";
import Submissions from "./Submissions";
import Configure from "./Configure";

export default function App() {
  return (
    <SnackbarProvider>
      <MakeEnqueueSnackbarGlobal />
      <Suspense fallback={<Page />}>
        <Router>
          <Switch>
            <Route exact path="/">
              <Links />
            </Route>
            <Route exact path="/user">
              <User />
            </Route>
            <Route exact path="/:waiver">
              <Waiver />
            </Route>
            <Route exact path="/:waiver/submissions">
              <Submissions />
            </Route>
            <Route exact path="/:waiver/configure">
              <Configure />
            </Route>
          </Switch>
        </Router>
      </Suspense>
    </SnackbarProvider>
  );
}

function MakeEnqueueSnackbarGlobal() {
  const { enqueueSnackbar } = useSnackbar();
  window.enqueueSnackbar = enqueueSnackbar;
  return null;
}
