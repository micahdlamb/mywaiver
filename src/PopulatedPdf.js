import React, { useState, useEffect } from 'react';
import * as server from './server';
import { Document, Page } from 'react-pdf';
import { withSize } from 'react-sizeme';

import { pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

function PopulatedPdf({ config, values, url, width, height, size }) {
    let [file, setFile] = useState(null)
    let [numPages, setNumPages] = useState(0)

    let renderHeight = height * size.width / width

    function handleLoadSuccess({ numPages }) {
        setNumPages(numPages)
    }

    useEffect(() => {
        server.getBasePdf(url).then(async basePdf => {
            let { PDFDocument, StandardFonts } = await import('pdf-lib')
            const pdf = await PDFDocument.load(basePdf)
            const pages = pdf.getPages()
            const page = pages[0]
            const { height } = page.getSize()
            const helveticaFont = await pdf.embedFont(StandardFonts.Helvetica)

            for (let step of Object.values(config.steps)) {
                for (let [name, field] of Object.entries(step.fields)) {
                    let value = values[name]
                    if (!value || value.length === 0) continue
                    let pos = field.position
                    if (!pos) continue

                    if (value instanceof ArrayBuffer) {
                        let png = await pdf.embedPng(value)
                        page.drawImage(png, {
                            x: pos.left,
                            y: height - (pos.top + pos.height),
                            width: pos.width,
                            height: pos.height
                        })

                        value = value.timestamp.toDateString()
                        pos = field.timestampPosition
                        if (!pos) continue
                    }

                    page.drawText(value.toString(), {
                        x: pos.left,
                        y: height - (pos.top + pos.height),
                        size: pos.height * 1.25,
                        font: helveticaFont,
                    })
                }
            }

            let data = await pdf.save()
            setFile({ data })
        })
    }, [url, config, values])

    return <div style={{height: renderHeight}}>
        {file &&
            <Document file={file} onLoadSuccess={handleLoadSuccess}>
                {[...Array(numPages).keys()].map(pageNumber =>
                    <Page key={pageNumber} pageNumber={pageNumber + 1} width={size.width} />
                )}
            </Document>
        }
    </div>
}

export default withSize()(PopulatedPdf)