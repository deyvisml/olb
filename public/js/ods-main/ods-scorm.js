const fs = require('fs');
const path = require('path');

const { BrowserWindow } = require('electron');
const xml2js = require('xml2js');

const PathUtils = require('../utils/path-utils');
const DeviceUtils = require("../utils/device-utils");

const ScormClient = {

    SCORM_VIEW_SIZE: {
        WIDTH: 1024,
        HEIGHT: 768
    },

    getManifest(bid, scormPackageName) {
        const scormPackagePath = `${bid}_WIDGET${path.sep}resource${path.sep}${scormPackageName}`;
        const manifestPath = `${PathUtils.bookPath}${scormPackagePath}${path.sep}imsmanifest.xml`;

        return fs.readFileSync(manifestPath, 'utf8');
    },

    async getResourcePathFromManifest(manifest) {
        const xml = await xml2js.parseStringPromise(manifest);

        return xml.manifest.resources[0].resource[0]['$'].href;
    },

    async getScormResourcePath(bid, scormPackageName) {
        const manifest = this.getManifest(bid, scormPackageName);
        const scormPackagePath = `${bid}_WIDGET${path.sep}resource${path.sep}${scormPackageName}`;
        const scormContentPath = await this.getResourcePathFromManifest(manifest);

        return `file://${PathUtils.bookPath}${scormPackagePath}${path.sep}${scormContentPath}`;
    },

    async launch(window, bid, scormPackageName) {
        const parentSize = {
            x: window.getPosition()[0],
            y: window.getPosition()[1],
            width: window.getSize()[0],
            height: window.getSize()[1]
        };

        const maximizable = (DeviceUtils.getOS() !== DeviceUtils.TARGET_LINUX);
        const scormPath = await this.getScormResourcePath(bid, scormPackageName);
        const scormView = new BrowserWindow({
            width: this.SCORM_VIEW_SIZE.WIDTH,
            height: this.SCORM_VIEW_SIZE.HEIGHT,
            x: (parentSize.x + Math.max(0, (parentSize.width - this.SCORM_VIEW_SIZE.WIDTH) / 2)),
            y: (parentSize.y + Math.max(0, (parentSize.height - this.SCORM_VIEW_SIZE.HEIGHT) / 2)),

            parent: window,
            modal: false,
            show: false,
            resizable: true,
            autoHideMenuBar: true,
            minimizable: false,
            maximizable: maximizable,
            fullscreenable: maximizable,
            webPreferences: {
                nodeIntegration: false,
            }
        });

        /**
         *  Deny APIWrapper2004.js request from web content.
         *  APIWrapper2004.js contains the code whether LMS API is existed in the Global Scope or not.
         *  If LMS API is not existed in the Global Scope, then it shows system alert to user.
         *  In order to avoid system alert is being exposed to user, OLB skips request for APIWrapper2004.js.
         */
        scormView.webContents.session.webRequest.onBeforeRequest(
            {
                urls: ['file://*/**/APIWrapper2004.js']
            }, (details, callback) => {
                callback({ cancel: true })
            });

        scormView.loadURL(scormPath);
        scormView.setMenu(null);
        scormView.once('ready-to-show', () => {
            scormView.show();
        });
    },

};

module.exports = {

    launch: ScormClient.launch.bind(ScormClient),

};