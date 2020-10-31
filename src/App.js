import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";
import { SnackbarProvider, useSnackbar } from 'notistack';

import Links from './Links';
import Waiver from './Waiver';
import Configure from './Configure';

export default function App() {
  return (
    <SnackbarProvider>
      <MakeEnqueueSnackbarGlobal/>
      <Router>
        <Switch>
          <Route exact path="/">
            <Links />
          </Route>
          <Route exact path="/:waiver">
            <Waiver />
          </Route>
          <Route exact path="/configure/:waiver">
            <Configure />
          </Route>
        </Switch>
      </Router>
    </SnackbarProvider>
  )
}

function MakeEnqueueSnackbarGlobal(){
  const { enqueueSnackbar } = useSnackbar();
  window.enqueueSnackbar = enqueueSnackbar
  return null
}