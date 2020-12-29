import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core";
import { Document, Page } from "react-pdf";
import { format } from "date-fns";

import * as server from "./server";

import { pdfjs } from "react-pdf";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const useStyles = makeStyles((theme) => ({
  container: {
    height: (props) => props.height,
    cursor: "zoom-in",
    "&:fullscreen": {
      overflowY: "scroll",
      cursor: "unset",
    },
  },
}));

export default function PopulatedPdf({ template, config, values, width }) {
  let [file, setFile] = useState(null);
  let [numPages, setNumPages] = useState(0);
  let [fullscreenWidth, setFullscreenWidth] = useState(null)

  let { pdfWidth, pdfHeight } = config;
  width = fullscreenWidth || width;
  let height = (pdfHeight * width) / pdfWidth;
  let classes = useStyles({ height });

  function handleLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  useEffect(() => {
    populatePdf(template, config, values).then((data) => setFile({ data }));
  }, [template, config, values]);

  async function goFullScreen(e) {
    let container = e.currentTarget
    await container.requestFullscreen();
    document.onfullscreenchange = () => {
      if (document.fullscreenElement)
        setFullscreenWidth(container.clientWidth);
      else {
        setFullscreenWidth(null);
        document.onfullscreenchange = undefined;
      }
    }
  }

  return (
    <div className={classes.container} onClick={goFullScreen}>
      {file && (
        <Document file={file} onLoadSuccess={handleLoadSuccess} loading={<></>}>
          {[...Array(numPages).keys()].map((pageNumber) => (
            <Page
              key={pageNumber}
              pageNumber={pageNumber + 1}
              width={width}
              renderTextLayer={false}
              loading={<></>}
            />
          ))}
        </Document>
      )}
    </div>
  );
}

export async function populatePdf(template, config, values) {
  let { PDFDocument, StandardFonts } = await import("pdf-lib");

  let templatePdf = await server.get_template_pdf(template);
  const pdf = await PDFDocument.load(templatePdf);
  const pages = pdf.getPages();
  const page = pages[0];
  const { height } = page.getSize();
  const helveticaFont = await pdf.embedFont(StandardFonts.Helvetica);

  for (let step of Object.values(config.steps)) {
    for (let [name, field] of Object.entries(step.fields)) {
      let value = values[name];
      if (!value || value.length === 0) continue;
      let pos = field.position;
      if (!pos) continue;

      if (value instanceof ArrayBuffer) {
        let png = await pdf.embedPng(value);
        page.drawImage(png, {
          x: pos.left,
          y: height - (pos.top + pos.height),
          width: pos.width,
          height: pos.height,
        });

        pos = field.timestampPosition;
        if (!pos) continue;
        value = config.timestampFormat
          ? format(value.timestamp, config.timestampFormat)
          : value.timestamp.toDateString();
      }

      if (Array.isArray(value))
        value = value.join(field.vertical ? "\n" : ", ");

      page.drawText(value.toString(), {
        x: pos.left,
        y: height - (pos.top + pos.height) + 2, // TODO Not sure why +2 is needed...
        size: pos.height * 1.25,
        font: helveticaFont,
      });
    }
  }

  return pdf.save();
}
