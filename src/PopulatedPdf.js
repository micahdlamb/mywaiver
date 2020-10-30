import React, { useState, useEffect } from 'react';
import Pdf from './Pdf';
import * as server from './server';

export default function PopulatedPdf({ config, values }){
    let [file, setFile] = useState(null)

    useEffect(() => {
        server.getBasePdf().then(async basePdf => {
            let {PDFDocument, StandardFonts} = await import('pdf-lib')
            const pdf = await PDFDocument.load(basePdf)
            const pages = pdf.getPages()
            const page = pages[0]
            const { height } = page.getSize()
            const helveticaFont = await pdf.embedFont(StandardFonts.Helvetica)

            for (let step of Object.values(config.steps)){
                for (let [name, field] of Object.entries(step.fields)){
                    let value = values[name]
                    if (!value || value.length === 0) continue
                    let pos = field.position
                    if (!pos) continue

                    if (value instanceof ArrayBuffer){
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
            setFile({data})
        })
    }, [config, values])

    return file && <Pdf file={file} />
}