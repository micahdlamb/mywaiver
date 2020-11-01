// https://github.com/mui-org/material-ui/tree/master/docs/src/pages/getting-started/templates/checkout
import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from "react-router-dom";
import {
    makeStyles,
    List,
    ListItem,
    ListItemSecondaryAction,
    Link,
    IconButton,
} from '@material-ui/core';
import SettingsIcon from '@material-ui/icons/Settings';

import Page from './Page';

import * as server from './server';

const useStyles = makeStyles((theme) => ({
    root: {
        backgroundColor: theme.palette.background.paper,
        '& a.MuiLink-root': {
            flex: 1
        }
    }
}));

export default function Links() {
    let [configs, setConfigs] = useState([])
    let classes = useStyles()

    useEffect(() => {
        server.get_configs().then(setConfigs)
    }, [])

    return <Page title='Choose Waiver' contentWidth={400}>
        <List component="nav" className={classes.root}>
            {configs.map(config =>
                <ListItem button key={config}>
                    <Link component={RouterLink} to={`/${config}`}>
                        {config}
                    </Link>
                    <ListItemSecondaryAction>
                        <RouterLink to={`/configure/${config}`}>
                            <IconButton edge="end" aria-label="configure">
                                <SettingsIcon />
                            </IconButton>
                        </RouterLink>
                    </ListItemSecondaryAction>
                </ListItem>
            )}
        </List>
    </Page>
}