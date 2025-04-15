const $ = require('jquery');
const { ipcRenderer } = require('electron');
const Deeplink = require('../ods-main/ods-deeplink');
const messages = require('../ods-share/ods-messages');
const beautifier = require('../ods-renderer/utils/data-beautifier');
const ga = require('./utils/google-analytics');
const deeplink = ipcRenderer.sendSync('rdp-deeplink');

if (deeplink) {
    switch (deeplink.type) {
        case Deeplink.TYPE.AUTH0_SIGNIN:
            if (deeplink.code) {
                document.getElementById('loading-background').style.display = 'block';

                ipcRenderer.send('auth-auth0-signin-complete', deeplink.code);
            }
            break;

        case Deeplink.TYPE.OPEN_BOOK:
            if (deeplink.connection) {
                ipcRenderer.send('rdp-pending-deeplink', deeplink);
                ipcRenderer.send('auth-auth0-sign-with-connection', deeplink.connection);
            }
            break;
    }
}

global.showRegisterForm = () => {
    ipcRenderer.send('view-dest-ces-register');

    ga.screen(ga.SCREEN.REGISTER);
};

// User requests to open Sign in page.
global.signin = () => {
    if (navigator.onLine) {
        ipcRenderer.send('view-dest-open-idp');
        ga.screen(ga.SCREEN.LOGIN);
    } else {
        alert(messages.network_connection_required);
    }
};

// User submits their credentials and Auth0 returns authorizationCode.
ipcRenderer.on('auth-signin-authorization-code-acquired', (event, authorizationCode, codeVerifier) => {
    document.getElementById('loading-background').style.display = 'block';

    ipcRenderer.send('auth-signin-complete', authorizationCode, codeVerifier);
});

// With JWT Token, ODS has acquired the credential for CES API.
ipcRenderer.on('auth-signin-post-signin', (event, newUser) => {
    const firstName = beautifier.getFirstnameWithFrontSpace((newUser != null) ? newUser.firstName : null);

    if (newUser == null) {
        document.getElementById('loading-background').style.display = 'none';

        ipcRenderer.send('dialog-temporarily-unavailable');
    } else if (newUser.response && typeof newUser.response === 'string'
        && (newUser.response.includes('Signature expired') || newUser.response.includes('Signature not yet'))) {
        document.getElementById('loading-background').style.display = 'none';

        ipcRenderer.send('dialog-invalid-timestamp');
    } else if (newUser.legacy) {
        document.getElementById('loading-background').style.display = 'none';

        $('#modal').load('./modal/modal-legacy.html', () => {
            $('.success-first-name').text(firstName);
        });
        $('#modal').modal({backdrop: 'static', keyboard: false});
    } else if (newUser.partial) {
        document.getElementById('loading-background').style.display = 'none';

        $('#modal').load('./modal/modal-partial.html', () => {
            $('.success-first-name').text(firstName);
        });
        $('#modal').modal({backdrop: 'static', keyboard: false});
    } else {
        document.getElementById('loading-background').style.display = 'block';

        ipcRenderer.send('view-dest-bookshelf');
    }
});
