const { ipcRenderer } = require('electron');

const userDataSync = {

    sync() {
        if (navigator.onLine) {
            document.getElementById('loading-background').style.display = 'block';

            ipcRenderer.send('rdp-bookshelf-sync-start');
        }
    },

    updateStatus() {
        if (ipcRenderer.sendSync('rdp-bookshelf-sync-required')) {
            document.getElementById('ads-sync-required').style.display = 'block';
        } else {
            document.getElementById('ads-sync-required').style.display = 'none';
        }
    },

    bindEvents() {
        document.getElementById('ads-sync-required').addEventListener('click', () => {
            userDataSync.sync();
        });

        ipcRenderer.on('rdp-bookshelf-sync-on-started', () => {
            document.getElementById('loading-background').style.display = 'block';
        });

        ipcRenderer.on('rdp-bookshelf-sync-on-completed', () => {
            document.getElementById('loading-background').style.display = 'none';

            userDataSync.updateStatus();
        });
    }
};

userDataSync.bindEvents();
userDataSync.updateStatus();