import React, { useState, useEffect } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { formatDistanceToNow, fromUnixTime } from "date-fns";
import { Box, Typography, LinearProgress, IconButton } from "@material-ui/core";
import { DataGrid } from "@material-ui/data-grid";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";

import Page from "./Page";

import * as server from "./server";

export default function Submissions() {
  let { waiver } = useParams();
  let [submissions, setSubmissions] = useState(null);
  let config = server.get_config(waiver);

  useEffect(() => {
    server.get_submissions(waiver).then(setSubmissions);
  }, [waiver]);

  return (
    <Page title={waiver} contentWidth={1000}>
      {submissions ? (
        submissions.length ? (
          <Data waiver={waiver} config={config} submissions={submissions} />
        ) : (
          <Typography align="center" color="textSecondary">
            No submissions
          </Typography>
        )
      ) : (
        <Box m={1}>
          <LinearProgress />
        </Box>
      )}
    </Page>
  );
}

function Data({ waiver, config, submissions }) {
  let downloadLink = ({ value }) => (
    <RouterLink to={`/${waiver}/${value}/download`} target="_blank">
      <IconButton color={"primary"}>
        <OpenInNewIcon />
      </IconButton>
    </RouterLink>
  );
  let cols = [
    {
      field: "id",
      renderHeader: () => <>&nbsp;</>,
      renderCell: downloadLink,
      width: 65,
    },
  ];

  for (let step of Object.values(config.steps))
    for (let [name, field] of Object.entries(step.fields))
      if (field.type !== "signature")
        cols.push({
          field: name,
          headerName: name,
          flex: 1,
        });

  cols.push({
    field: "create_date",
    headerName: "Date",
    valueFormatter: ({ value }) =>
      formatDistanceToNow(fromUnixTime(value), { addSuffix: true }),
    width: 160,
  });

  let rows = submissions.map((sub) => ({ ...sub, ...sub.values }));

  return (
    <div style={{ height: 400, width: "100%" }}>
      <DataGrid columns={cols} rows={rows} disableSelectionOnClick />
    </div>
  );
}
