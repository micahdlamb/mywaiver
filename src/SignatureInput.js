import React, { useState, useRef } from 'react';
import {
    makeStyles,
    Button,
    Dialog,
    DialogContent,
    DialogActions,
} from '@material-ui/core';
import CreateIcon from '@material-ui/icons/Create';

import SignatureCanvas from 'react-signature-canvas';

import { useField } from 'formik';

const useStyles = makeStyles((theme) => ({
    container: {
        cursor: 'pointer',
        display: 'flex',
        '& > div:first-child': {
            flex: 1,
            border: '1px solid grey',
            borderRight: 0,
            borderRadius: '5px 0 0 5px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            '& img': {
                maxHeight: '30px'
            }
        }
    },
    pad: {
        '& canvas': {
            width: '800px',
            height: '200px',
            maxWidth: '100%',
            maxHeight: '100%'
        }
    }
}));

function SignatureInput({ value, onChange, label }) {
    const classes = useStyles()
    let [open, setOpen] = useState(false)
    let pad = useRef(null)

    function clear(e) {
        pad.current.clear()
    }

    function save(e) {
        setOpen(false)
        if (pad.current.isEmpty()) return onChange(null)
        let canvas = pad.current.getCanvas()
        canvas.toBlob(async blob => {
            let bytes = await blob.arrayBuffer()
            bytes.dataURL = canvas.toDataURL()
            onChange(bytes)
        })
    }

    function restoreSignature(){
        value && pad.current.fromDataURL(value.dataURL)
    }

    return <>
        <div className={classes.container} onClick={e => setOpen(true)}>
            <div>
                {value ?
                    <img src={value.dataURL} alt='sig' />
                    :
                    label
                }
            </div>
            <Button
                variant="contained"
                color="secondary"
                startIcon={<CreateIcon />}
            >
                Sign
            </Button>
        </div>

        <Dialog
            open={open}
            onClose={e => setOpen(false)}
            maxWidth='xl'
            aria-labelledby="signature-pad"
        >
            {/* <DialogTitle>{label}</DialogTitle> */}
            <DialogContent className={classes.pad} onEntered={restoreSignature}>
                <SignatureCanvas ref={pad} />
            </DialogContent>
            <DialogActions>
                <Button onClick={clear}>
                    Clear
                </Button>
                <Button onClick={save} color="primary">
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    </>
}

export default function (props) {
    const [field, , helpers] = useField(props);
    field.onChange = helpers.setValue
    return <SignatureInput {...field} {...props} />
}