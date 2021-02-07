import React, { useState } from "react";
import {
  makeStyles,
  AppBar,
  TextField,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  Toolbar,
  IconButton,
  Typography,
} from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";

import { useField } from "formik";

import { EditorState, convertFromRaw, convertToRaw } from "draft-js";
import { Editor } from "react-draft-wysiwyg";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

const useStyles = makeStyles((theme) => ({
  input: {
    "& input": {
      cursor: "pointer",
    },
  },
  appBar: {
    position: "relative",
  },
  title: {
    marginLeft: theme.spacing(2),
    flex: 1,
  },
  content: {
    backgroundColor: "#EEF",
  },
  editor: {
    backgroundColor: "#FFF",
  },
}));

function WYSIWYGInput({ value, label, onChange, ...props }) {
  const classes = useStyles();
  let [open, setOpen] = useState(false);
  let [editorState, setEditorState] = useState(null);

  async function edit() {
    if (value) {
      let content = convertFromRaw(value);
      setEditorState(EditorState.createWithContent(content));
    } else setEditorState(EditorState.createEmpty());
    setOpen(true);
  }

  function close(e) {
    setOpen(false);
  }

  function clear(e) {
    setOpen(false);
    onChange(null);
  }

  function save(e) {
    setOpen(false);
    let content = editorState.getCurrentContent();
    onChange(convertToRaw(content));
  }

  return (
    <>
      <TextField
        InputProps={{
          readOnly: true,
          className: classes.input,
        }}
        value={value ? "<html/>" : ""}
        label={label}
        onClick={edit}
        {...props}
      />
      <Dialog
        open={open}
        onClose={(e) => setOpen(false)}
        className={classes.dialog}
        fullScreen
      >
        <AppBar className={classes.appBar}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={close}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
            <Typography variant="h6" className={classes.title}>
              {label}
            </Typography>
          </Toolbar>
        </AppBar>
        <DialogContent className={classes.content}>
          {editorState && (
            <Editor
              editorState={editorState}
              editorClassName={classes.editor}
              onEditorStateChange={setEditorState}
              toolbar={{
                image: {
                  uploadCallback: encodeToBase64,
                  previewImage: true,
                },
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={clear}>Clear</Button>
          <Button onClick={save} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default function (props) {
  const [field, , helpers] = useField(props);
  field.onChange = helpers.setValue;
  return <WYSIWYGInput {...field} {...props} />;
}

export function renderDraftJSContent(value) {
  if (!value) return null;
  const contentState = convertFromRaw(value);
  const editorState = EditorState.createWithContent(contentState);
  return <Editor editorState={editorState} readOnly toolbarHidden />;
}

const encodeToBase64 = (file) =>
  new Promise((resolve) => {
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve({ data: { link: reader.result } });
  });
