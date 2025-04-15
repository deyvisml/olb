const { shell, ipcRenderer } = require('electron');
const $ = jQuery = require('jquery');   // eslint-disable-line
const ga = require('./utils/google-analytics');

// const Sentry = require('@sentry/electron');
// Sentry.init({
/* Report is available from: https://sentry.io/iportfolio-inc-1p/ods/ */
// dsn: 'https://6a3f5c247b4b44aca77b70d1f0760d86@sentry.io/159563',
// environment: Environment.env
// });

require('../lib/jquery.validate.min');  // field (email, password) validation.
require('../lib/bootstrap.min');

global.signout = () => {
    ipcRenderer.send('auth-signout');

    ga.sendEvent(ga.CATEGORY.USER, ga.ACTION.LOGOUT);
};

global.help = (target) => {
    ipcRenderer.send('view-dest-open-help', target);

    ga.screen(ga.SCREEN.HELP);
};

global.openBrowser = (target) => {
    shell.openExternal(target);
};

ipcRenderer.on('closeApplication', () => {
    ipcRenderer.send('app-exit');
});

ipcRenderer.on('menu-help', () => {
    global.help();
});

ipcRenderer.on('menu-signout', () => {
    global.signout();
});

ipcRenderer.send('network-status-initialize', navigator.onLine);

window.addEventListener('online', () => {
    ipcRenderer.send('network-status-changed', navigator.onLine);
});

window.addEventListener('offline', () => {
    ipcRenderer.send('network-status-changed', navigator.onLine);
});

$('html').on('show.bs.modal', () => {
    $('html').css('overflow-y', 'hidden');
});

$('html').on('hide.bs.modal', () => {
    $('html').css('overflow-y', 'auto');
});