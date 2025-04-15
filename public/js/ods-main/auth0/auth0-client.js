const { ipcRenderer } = require('electron');

const register = location.href.includes('register');

// noinspection JSUnusedGlobalSymbols
window.olbOfflineClient = {
    // Remark: This methods is promised interface with OUP CES Sign in Page.
    // Below method is called when user click 'Continue with Google' button from CES Sign in Page.
    continueWithConnection: (connection) => {
        ipcRenderer.send('auth-google-signin-via-default-browser', connection, register);
    },

    reloadSignInWebpage: () => {
        ipcRenderer.send('reload-signin-page-request-from-ces');
    },
};
