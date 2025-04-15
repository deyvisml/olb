const { ipcRenderer } = require('electron');
const $ = require('jquery');
const rightPanel = require('../right-panel');
const beautifier = require('../../utils/data-beautifier');

function bindView() {
    const user = ipcRenderer.sendSync('rdp-user');
    const fullname = beautifier.getFullname(user.firstName, user.lastName);

    $('#user-profile-fullname').text(fullname);
    $('#user-profile-email').text(user.userName);
}

function bindEvents() {
    $('#edit-profile-back').bind('click', () => {
        rightPanel.openPanel('right-edit-profile');
    });
}

global.onEditConfirmPanelLoaded = () => {
    bindView();
    bindEvents();
};