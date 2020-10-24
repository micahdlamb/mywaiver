import React from 'react';

import Page from './Page';

import Pdf from './Pdf';

export default function Configure(){

    return <Page title='Configure' contentWidth={800}>
        <Pdf file={'waiver.pdf'}/>
    </Page>

}