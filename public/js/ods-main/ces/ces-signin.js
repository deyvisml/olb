const path = require('path');

const { session, BrowserWindow, app } = require('electron');

const EnvConfig = require('../../config/env-config');
const Auth0 = require('../auth0/auth0')
const CesUrlResolver = require('./ces-url-resolver');

const CesSignin = {

    IDP_WINDOW_WIDTH: 800,

    ScanningURLs: [
        'https://*.account.oup.com/register',
        'https://*.account.oup.com/support',
        'https://*.oxfordlearnersbookshelf.com/*',
        EnvConfig.get(EnvConfig.OLBConfig.OLB_BOOKSHELF)
    ],

    idpWindow: null,

    codeVerifier: null,

    async open(parent) {
        const xy = parent.getPosition();

        this.idpWindow = new BrowserWindow({
            parent: parent,
            resizable: true,
            width: this.IDP_WINDOW_WIDTH,

            x: xy[0] + ((parent.getSize()[0] - this.IDP_WINDOW_WIDTH) / 2),
            y: xy[1] + 50,

            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                preload: path.join(app.getAppPath(), 'public/js/ods-main/auth0/auth0-client.js')
            }
        });

        this.loadSigninPage();
        this.idpWindow.webContents.session.webRequest
            .onBeforeSendHeaders({urls: this.ScanningURLs}, (details, callback) => {
                switch (CesUrlResolver.resolve(details.url)) {
                    case CesUrlResolver.HELP_SUPPORT_PAGE:
                        parent.webContents.executeJavaScript('help();');
                        this.idpWindow.close();
                        break;

                    case CesUrlResolver.REGISTER_PAGE:
                        parent.webContents.executeJavaScript('showRegisterForm();');
                        this.idpWindow.close();
                        break;

                    case CesUrlResolver.SIGN_IN_PAGE:
                        // Do not handle when user back to sign-in page.
                        // this.loadSigninPage();
                        break;
                }

                callback({ cancel: false, requestHeaders: details.requestHeaders });
            });

        // The URL filter should contain protocol, domain and path.
        session.defaultSession.webRequest.onBeforeRedirect({ urls: ['*://*/*'] }, (details) => {
            if (CesUrlResolver.redirectedWithAuthorizationCode(details.redirectURL)) {
                const authorizationCode = CesUrlResolver.getAuthorizationCode(details.redirectURL);

                parent.webContents.send('auth-signin-authorization-code-acquired', authorizationCode, this.codeVerifier);

                this.close();
            }
        });
    },

    close() {
        if (this.idpWindow && !this.idpWindow.isDestroyed()) {
            this.idpWindow.close();
        }
    },

    prepareCodeVerifier() {
        this.codeVerifier = Auth0.Params.getCodeVerifier();
    },

    loadSigninPage() {
        this.prepareCodeVerifier();

        const codeChallenge = Auth0.Params.getCodeChallenge(this.codeVerifier);
        const signinUrl = Auth0.URL.buildSigninUrl({
            hostname: EnvConfig.get(EnvConfig.Auth0Config.AUTH0_IDP_URL),
            clientId: EnvConfig.get(EnvConfig.Auth0Config.INTEGRATION_CLIENT_ID),
            redirectUrl: EnvConfig.get(EnvConfig.OLBConfig.OLB_BOOKSHELF),
            state: global.device.id,
            codeChallenge: codeChallenge,
            audience: EnvConfig.get(EnvConfig.Auth0Config.AUTH0_AUDIENCE),
        });

        this.idpWindow.loadURL(signinUrl);
    }

};

module.exports = CesSignin;