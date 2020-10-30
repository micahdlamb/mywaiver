import React, { useState, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import {
    makeStyles,
    Box,
    Typography
} from '@material-ui/core';

const useStyles = makeStyles(theme => ({
    center: {
        textAlign: 'center',
        '& > *': {
            display: 'inline-block',
            position: 'relative',
            cursor: 'crosshair',
            border: '1px solid #AAA',
            '& .drag-box': {
                position: 'absolute',
                border: '1px solid #FF00FF',
                backgroundColor: '#FF00FF22'
            }
        }
    },
}));

export default function Configure() {
    let classes = useStyles()
    let [coords, setCoords] = useState({})
    let [dim, setDim] = useState({})

    let [numPages, setNumPages] = useState(0)
    function handleLoadSuccess({ numPages }) {
        setNumPages(numPages)
    }

    useEffect(() => {
        const container = document.querySelector('.react-pdf__Document')
        let start, end, div

        function coords(e) {
            let r = container.getBoundingClientRect()
            return [e.clientX - r.left, e.clientY - r.top]
        }

        function box(append = 0) {
            let left = Math.round(Math.min(start[0], end[0])) + append
            let top = Math.round(Math.min(start[1], end[1])) + append
            let width = Math.abs(end[0] - start[0]) + append
            let height = Math.abs(end[1] - start[1]) + append
            return { left, top, width, height }
        }

        container.onmousedown = e => {
            start = end = coords(e)

            div = document.createElement('div')
            div.classList.add('drag-box')
            container.appendChild(div)
        }

        container.onmousemove = e => {
            if (!div) return
            end = coords(e)

            Object.assign(div.style, box('px'))
        }

        document.onmouseup = e => {
            if (!div) return
            div.remove()
            div = null
            setCoords(box())
        }
    })

    function handleRenderSuccess(){
        const container = document.querySelector('.react-pdf__Document')
        setDim({width: container.clientWidth, height: container.clientHeight})
    }

    return <Box p={1}>
        <Typography align='center' color='primary' gutterBottom>
            {JSON.stringify(coords)}
        </Typography>
        <div className={classes.center}>
            <Document file={'waiver.pdf'} onLoadSuccess={handleLoadSuccess}>
                {[...Array(numPages).keys()].map(pageNumber =>
                    <Page key={pageNumber} pageNumber={pageNumber + 1} renderTextLayer={false} onRenderSuccess={handleRenderSuccess}/>
                )}
            </Document>
        </div>
        <Typography align='center' color='primary'>
            {JSON.stringify(dim)}
        </Typography>
    </Box>
}