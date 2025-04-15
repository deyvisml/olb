const { ipcRenderer } = require('electron');

const gameSync = {
    STATUS: {
        DONE: 0,
        REQUIRED: 1,
        PROGRESSING: 2,
    },

    init() {
        ipcRenderer.send('rdp-game-request-status');
    },

    sync() {
        document.getElementById('update-game-required').style.display = 'none';
        document.getElementById('update-game-inprogress').style.display = 'block';

        ipcRenderer.send('view-bookshelf-game-update-start');
    },

    updateStatus(status) {
        switch (status) {
            case gameSync.STATUS.REQUIRED:
                document.getElementById('update-game-inprogress').style.display = 'none';
                document.getElementById('update-game-required').style.display = 'block';
                break;

            case gameSync.STATUS.PROGRESSING:
                document.getElementById('update-game-inprogress').style.display = 'block';
                document.getElementById('update-game-required').style.display = 'none';
                break;

            case gameSync.STATUS.DONE:
            default:
                document.getElementById('update-game-inprogress').style.display = 'none';
                document.getElementById('update-game-required').style.display = 'none';
                break;
        }
    },

    bindEvents() {
        document.getElementById('update-game-required').addEventListener('click', () => {
            gameSync.sync();
        });

        ipcRenderer.on('rdp-game-latest-status', (event, status) => {
            gameSync.updateStatus(status);
        });

        ipcRenderer.on('view-bookshelf-game-update-done', () => {
            gameSync.updateStatus(gameSync.STATUS.DONE);
        });
    },
};

gameSync.bindEvents();
gameSync.init();