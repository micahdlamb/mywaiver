import React, { useState, useEffect } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { formatDistanceToNow, fromUnixTime } from "date-fns";
import {
  Paper,
  Box,
  Typography,
  LinearProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from "@material-ui/core";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";

import Page from "./Page";

import * as server from "./server";

export default function Submissions() {
  let { template } = useParams();
  let [submissions, setSubmissions] = useState(null);
  let config = server.get_template_config(template);

  useEffect(() => {
    server.get_submissions(template).then(setSubmissions);
  }, [template]);

  return (
    <>
      <Page title={template} />
      <Box p={2} mx={"auto"} maxWidth={1200}>
        {submissions ? (
          submissions.length ? (
            <SubmissionsTable
              template={template}
              config={config}
              submissions={submissions}
            />
          ) : (
            <Typography align="center" color="textSecondary">
              No submissions
            </Typography>
          )
        ) : (
          <LinearProgress />
        )}
      </Box>
    </>
  );
}

function SubmissionsTable({ template, config, submissions }) {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  let cols = [
    {
      field: "id",
      headerName: "",
      renderCell: (value) => (
        <RouterLink
          to={server.get_submission_pdf_url(template, value)}
          target="_blank"
        >
          <IconButton color={"primary"}>
            <OpenInNewIcon />
          </IconButton>
        </RouterLink>
      ),
    },
  ];

  for (let step of Object.values(config.steps))
    for (let [name, field] of Object.entries(step.fields))
      if (field.type !== "signature")
        cols.push({
          field: name,
          headerName: field.label || name,
          renderCell: (value) =>
            Array.isArray(value) ? value.join(", ") : value,
        });

  cols.push({
    field: "last_use_date",
    headerName: "Last Use",
    renderCell: (value) =>
      formatDistanceToNow(fromUnixTime(value), { addSuffix: true }),
  });

  let rows = submissions.map((sub) => ({ ...sub, ...sub.values }));

  return (
    <Paper>
      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {cols.map((col) => (
                <TableCell key={col.field} align="left">
                  {col.headerName}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => {
                return (
                  <TableRow hover key={row.id}>
                    {cols.map((col) => (
                      <TableCell key={col.field} align={"left"}>
                        {col.renderCell(row[col.field])}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 100]}
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onChangePage={handleChangePage}
        onChangeRowsPerPage={handleChangeRowsPerPage}
      />
    </Paper>
  );
}
