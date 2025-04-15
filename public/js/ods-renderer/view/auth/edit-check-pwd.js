const { ipcRenderer } = require('electron');
const $ = require('jquery');
const messages = require('../../../ods-share/ods-messages');
const beautifier = require('../../utils/data-beautifier');
const rightPanel = require('../right-panel');

function bindView() {
    const user = ipcRenderer.sendSync('rdp-user');

    $('#user-profile-initial').text(beautifier.getAcronym(user.firstName, user.lastName));
    $('#user-profile-fullname').text(beautifier.getFullname(user.firstName, user.lastName));
    $('#user-profile-email').text(user.userName);
    $('#user-profile-firstname').val(user.firstName);
    $('#user-profile-lastname').val(user.lastName);
}

function bindEvents() {
    $('#user-profile-password').bind('change', () => {
        $('#submit-check-password').prop('disabled', false);

        $('#user-profile-password').parent().removeClass('form-validation-error');
        $('#user-profile-password').parent().addClass('validation-none');
        $('#user-profile-password').parent().parent().children('ul').hide();
    });

    $('#submit-check-password').bind('click', (e) => {
        e.preventDefault();

        if (navigator.onLine) {
            document.getElementById('loading-background').style.display = 'block';

            ipcRenderer.send('action-check-password-request', $('#user-profile-password').val());

            return false;
        } else {
            alert(messages.network_connection_required);
        }
    });
}

ipcRenderer.on('action-check-password-response', (event, res) => {
    document.getElementById('loading-background').style.display = 'none';

    if (res.success && res.body?.status === 'success') {
        rightPanel.openPanel('right-edit-credentials', {
            'user-profile-org-password': $('#user-profile-password').val()
        });

        $('#user-profile-password').parent().removeClass('form-validation-error');
        $('#user-profile-password').parent().addClass('validation-none');
        $('#user-profile-password').parent().parent().children('ul').hide();
    } else {
        $('#user-profile-password').parent().addClass('form-validation-error');
        $('#user-profile-password').parent().parent().children('ul').show();
    }
});

global.onEditCheckPwdPanelLoaded = () => {
    bindView();
    bindEvents();
};