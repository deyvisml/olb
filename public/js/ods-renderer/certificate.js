const { ipcRenderer } = require('electron');
const messages = require('../ods-share/ods-messages');
const ga = require('./utils/google-analytics');

document.getElementById('olb-share-csv').addEventListener('click', () => {
    if (window.navigator.onLine) {
        ipcRenderer.send('action-diary-certificate', 'csv');

        ga.sendEvent(ga.CATEGORY.CERTIFICATE, ga.ACTION.DOWNLOAD, 'CSV');
    } else {
        alert(messages.certificate_csv_offline);
    }
});

document.getElementById('olb-share-pdf').addEventListener('click', () => {
    if (window.navigator.onLine) {
        ipcRenderer.send('action-diary-certificate', 'pdf');

        ga.sendEvent(ga.CATEGORY.CERTIFICATE, ga.ACTION.DOWNLOAD, 'PDF');
    } else {
        alert(messages.certificate_pdf_offline);
    }
});