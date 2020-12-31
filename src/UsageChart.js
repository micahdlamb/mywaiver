import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import { Box, LinearProgress, Button, Menu, MenuItem } from "@material-ui/core";

import { AppBar } from "./Page";

import * as server from "./server";

export default function UsageChart() {
  let { template } = useParams();
  let [data, setData] = useState(null);
  let [groupBy, setGroupBy] = useState("day");
  const [anchorEl, setAnchorEl] = React.useState(null);
  let config = server.get_template_config(template);

  let getData = useCallback(async () => {
    setData(null);
    setData(await server.get_use_counts(template, groupBy));
  }, [template, groupBy]);

  useEffect(() => {
    getData();
  }, [getData]);

  const showMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeMenu = (e) => {
    setAnchorEl(null);
    let value = e.target.getAttribute("value");
    if (value) setGroupBy(value);
  };

  return (
    <>
      <AppBar title={`${config.title} Usage`}>
        <Button color="inherit" onClick={showMenu}>
          {groupBy}
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClick={closeMenu}
          onClose={closeMenu}
          keepMounted
        >
          <MenuItem value="day">Day</MenuItem>
          <MenuItem value="month">Month</MenuItem>
          <MenuItem value="year">Year</MenuItem>
        </Menu>
      </AppBar>
      <Box p={2} mx={"auto"} maxWidth={1200}>
        {data ? (
          <Bar
            data={{
              labels: data[0],
              datasets: [
                {
                  // label: "?",
                  data: data[1],
                  backgroundColor: "rgba(0,200,83, 0.3)",
                  strokeColor: "rgba(255,255,255,1)",
                  borderWidth: 2,
                },
              ],
            }}
            options={{
              title: {
                display: true,
                text:
                  "Submissions by " +
                  groupBy[0].toUpperCase() +
                  groupBy.slice(1),
                fontSize: 20,
              },
              legend: {
                display: false,
              },
              scales: {
                yAxes: [
                  {
                    display: true,
                    ticks: {
                      beginAtZero: true,
                      precision: 0,
                    },
                  },
                ],
              },
            }}
          />
        ) : (
          <LinearProgress />
        )}
      </Box>
    </>
  );
}
