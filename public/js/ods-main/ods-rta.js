const path = require('path');
const { BrowserWindow, app } = require('electron');
const PathUtils = require('../utils/path-utils');
const DeviceUtils = require("../utils/device-utils");

const RtaClient = {

    RTA_VIEW_SIZE: {
        WIDTH: 1024,
        HEIGHT: 768
    },

    getRtaViewerPath() {
        return `file://${PathUtils.appPath}/public/html/rta/index.html`;
    },

    async launch(window, filename) {
        const parentSize = {
            x: window.getPosition()[0],
            y: window.getPosition()[1],
            width: window.getSize()[0],
            height: window.getSize()[1]
        };

        const maximizable = (DeviceUtils.getOS() !== DeviceUtils.TARGET_MAC);
        const rtaView = new BrowserWindow({
            width: this.RTA_VIEW_SIZE.WIDTH,
            height: this.RTA_VIEW_SIZE.HEIGHT,
            x: (parentSize.x + Math.max(0, (parentSize.width - this.RTA_VIEW_SIZE.WIDTH) / 2)),
            y: (parentSize.y + Math.max(0, (parentSize.height - this.RTA_VIEW_SIZE.HEIGHT) / 2)),

            parent: window,
            modal: false,
            show: false,
            resizable: true,
            autoHideMenuBar: true,
            minimizable: false,
            maximizable: maximizable,
            fullscreenable: maximizable,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                preload: path.join(app.getAppPath(), 'public/html/rta/interface/rta-interface.js')
            }
        });

        rtaView.loadURL(`${this.getRtaViewerPath()}?userId=${global.user.id}&filename=${encodeURI(filename)}`);
        rtaView.setMenu(null);
        rtaView.once('ready-to-show', () => {
            rtaView.show();
        });
    },

};

module.exports = {

    launch: RtaClient.launch.bind(RtaClient),

};