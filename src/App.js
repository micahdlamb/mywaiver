import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";
import { SnackbarProvider, useSnackbar } from 'notistack';

import Waiver from './Waiver';
import Configure from './Configure';

export default function App() {
  return (
    <SnackbarProvider>
      <MakeEnqueueSnackbarGlobal/>
      <Router>
        <Switch>
          <Route exact path="/">
            <Waiver />
          </Route>
          <Route exact path="/configure">
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