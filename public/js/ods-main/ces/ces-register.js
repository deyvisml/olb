const path = require("path");

const { BrowserWindow, app } = require('electron');

const EnvConfig = require('../../config/env-config');
const CesSigninWindow = require("../ces/ces-signin");
const CesUrlResolver = require("./ces-url-resolver");

const CesRegister = {

    WINDOW_WIDTH: 1024,
    WINDOW_HEIGHT: 800,

    ScanningURLs: [
        'https://*.oxfordlearnersbookshelf.com/*',
        EnvConfig.get(EnvConfig.OLBConfig.OLB_BOOKSHELF)
    ],

    cesRegisterWindow: null,

    async open(parent) {
        const xy = parent.getPosition();

        this.cesRegisterWindow = new BrowserWindow({
            parent: parent,
            resizable: true,
            width: this.WINDOW_WIDTH,
            height: this.WINDOW_HEIGHT,

            x: xy[0] + ((parent.getSize()[0] - this.WINDOW_WIDTH) / 2),
            y: xy[1] + 50,

            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                preload: path.join(app.getAppPath(), 'public/js/ods-main/auth0/auth0-client.js')
            }
        });

        this.cesRegisterWindow.loadURL(this.getSocialRegisterUrl());
        this.cesRegisterWindow.webContents.session.webRequest
            .onBeforeSendHeaders({ urls: this.ScanningURLs }, (details, callback) => {
                const url = details.url;

                switch (CesUrlResolver.resolve(url)) {
                    case CesUrlResolver.HELP_SUPPORT_PAGE:
                        parent.webContents.executeJavaScript('help();');
                        this.cesRegisterWindow.close();
                        break;
                    case CesUrlResolver.SIGN_IN_PAGE:
                        this.cesRegisterWindow.close();

                        CesSigninWindow.open(parent);
                        break;
                }
                callback({ cancel: false, requestHeaders: details.requestHeaders });
            });
    },

    close() {
        if (this.cesRegisterWindow && !this.cesRegisterWindow.isDestroyed()) {
            this.cesRegisterWindow.close();
        }
    },

    getSocialRegisterUrl() {
        const registerUrl = EnvConfig.get(EnvConfig.CESConfig.CES_URL_REGISTER);
        const targetUrl = EnvConfig.get(EnvConfig.OLBConfig.OLB_BOOKSHELF);

        return `${registerUrl}?` +
            `target_url=${targetUrl.replace('https://', '')}` +
            `&providerId=OLB_MOBILE`;
    },
};

module.exports = CesRegister;