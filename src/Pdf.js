import React, {useState} from 'react';
import { Document, Page } from 'react-pdf';
import {withSize} from 'react-sizeme';

import { pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

function Pdf({file, size}){
    let [numPages, setNumPages] = useState(0)

    function handleLoadSuccess({numPages}){
        setNumPages(numPages)
    }

    return <Document file={file} onLoadSuccess={handleLoadSuccess}>
        {[...Array(numPages).keys()].map(pageNumber =>
            <Page key={pageNumber} pageNumber={pageNumber+1} width={size.width}/>
        )}
    </Document>
}

export default withSize()(Pdf)