import React, { Suspense } from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import * as snackbar from "./snackbar";

import Page from "./Page";
import User from "./User";
import LandingPage from "./LandingPage";
import { MyWaivers, DemoWaivers } from "./Links";
import Waiver from "./Waiver";
import Submissions from "./Submissions";
import Configure from "./Configure";

export default function App() {
  return (
    <snackbar.Provider>
      <Suspense fallback={<Page />}>
        <Router>
          <Switch>
            <Route exact path="/">
              <LandingPage />
            </Route>
            <Route exact path="/mywaivers">
              <MyWaivers />
            </Route>
            <Route exact path="/demos">
              <DemoWaivers />
            </Route>
            <Route exact path="/user">
              <User />
            </Route>
            <Route exact path="/:template">
              <Waiver />
            </Route>
            <Route exact path="/:template/submissions">
              <Submissions />
            </Route>
            <Route exact path={["/:template/configure", "/configure/new"]}>
              <Configure />
            </Route>
          </Switch>
        </Router>
      </Suspense>
    </snackbar.Provider>
  );
}
