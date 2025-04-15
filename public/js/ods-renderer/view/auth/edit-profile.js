const { ipcRenderer } = require('electron');
const $ = require('jquery');
const messages = require('../../../ods-share/ods-messages');
const beautifier = require('../../utils/data-beautifier');
const profileWidget = require('../profile-widget/popup');
const rightPanel = require('../right-panel');

function bindView() {
    const user = ipcRenderer.sendSync('rdp-user');

    $('#user-profile-initial').text(beautifier.getAcronym(user.firstName, user.lastName));
    $('#user-profile-fullname').text(beautifier.getFullname(user.firstName, user.lastName));
    $('#user-profile-email').text(user.userName);
    $('#user-profile-firstname').val(user.firstName);
    $('#user-profile-lastname').val(user.lastName);

    if (user.userName === user.email) {
        $('#change-username-password').text('Change my username or password');
    } else {
        $('#change-username-password').text('Change my username, email or password');
    }
}

function bindEvents() {
    $('#user-profile-firstname, #user-profile-lastname').bind('change', (e) => {
        $(e.target).valid();
        $('#submit-edit-profile').prop('disabled', false);
    });

    $('#change-username-password').bind('click', () => {
        rightPanel.changePanel('right-edit-check-pwd');
    });

    $('#submit-edit-profile').bind('click', () => {
        $('#submit-form-edit-profile').submit();
    });

    $('#submit-form-edit-profile').validate({
        rules: {
            firstName: {
                required: true
            },
            lastName: {
                required: true
            }
        },
        messages: {
            firstName: {
                required: messages.firstname_is_required
            },
            lastName: {
                required: messages.lastname_is_required
            }
        },
        onkeyup: false,
        focusInvalid: false,

        success: beautifier.onValidateSuccess,
        errorPlacement: beautifier.onValidateFailed,

        submitHandler() {
            if (navigator.onLine) {
                document.getElementById('loading-background').style.display = 'block';

                ipcRenderer.send('action-update-user-details-request', {
                    firstName: $('#user-profile-firstname').val(),
                    lastName: $('#user-profile-lastname').val()
                });
            } else {
                alert(messages.network_connection_required);
            }
            return false;
        },
    });
}

ipcRenderer.on('action-update-user-details-response', (event, response) => {
    document.getElementById('loading-background').style.display = 'none';

    if (response.success) {
        profileWidget.invalidate();

        rightPanel.changePanel('right-edit-confirm');
    }
});

global.onEditProfilePanelLoaded = () => {
    bindView();
    bindEvents();
};