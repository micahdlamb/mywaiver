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
  let { waiver } = useParams();
  let [submissions, setSubmissions] = useState(null);
  let config = server.get_config(waiver);

  useEffect(() => {
    server.get_submissions(waiver).then(setSubmissions);
  }, [waiver]);

  return (
    <>
      <Page title={waiver} />
      <Box p={2} mx={"auto"} maxWidth={1200}>
        {submissions ? (
          submissions.length ? (
            <SubmissionsTable
              waiver={waiver}
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

function SubmissionsTable({ waiver, config, submissions }) {
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
        <RouterLink to={`/${waiver}/${value}/download`} target="_blank">
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
                    {cols.map((col) => {
                      const value = row[col.field];
                      return (
                        <TableCell key={col.field} align={"left"}>
                          {col.renderCell ? col.renderCell(value) : value}
                        </TableCell>
                      );
                    })}
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
