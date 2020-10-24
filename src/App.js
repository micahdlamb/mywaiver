import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";

import Waiver from './Waiver';
import Configure from './Configure';

export default function App() {
  return (
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
  );
}