const { ipcRenderer } = require('electron');

const readingDiarySync = {

    sync() {
        if (navigator.onLine) {
            document.getElementById('loading-background').style.display = 'block';

            ipcRenderer.send('rdp-diary-sync-start');
        }
    },

    updateStatus() {
        if (ipcRenderer.sendSync('rdp-diary-sync-required')) {
            document.getElementById('diary-sync-required').style.display = 'block';
        } else {
            document.getElementById('diary-sync-required').style.display = 'none';
        }
    },

    bindEvents() {
        document.getElementById('diary-sync-required').addEventListener('click', () => {
            readingDiarySync.sync();
        });

        ipcRenderer.on('rdp-diary-sync-on-started', () => {
            document.getElementById('loading-background').style.display = 'block';
        });

        ipcRenderer.on('rdp-diary-sync-on-completed', () => {
            document.getElementById('loading-background').style.display = 'none';

            readingDiarySync.updateStatus();
        });
    }
};

readingDiarySync.bindEvents();
readingDiarySync.updateStatus();