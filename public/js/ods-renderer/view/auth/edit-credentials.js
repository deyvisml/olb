const { ipcRenderer } = require('electron');
const $ = require('jquery');
const messages = require('../../../ods-share/ods-messages');
const beautifier = require('../../utils/data-beautifier');
const profileWidget = require('../profile-widget/popup');
const rightPanel = require('../right-panel');

function bindView() {
    const user = ipcRenderer.sendSync('rdp-user');
    const isLegacy = (user.userName !== user.email);

    $('#user-profile-initial').text(beautifier.getAcronym(user.firstName, user.lastName));
    $('#user-profile-fullname').text(beautifier.getFullname(user.firstName, user.lastName));
    $('#user-profile-new-username').val(user.userName);
    $('#user-profile-new-email').val(user.email);

    if (isLegacy) {
        $('#edit-username-guide').text('This is the username you use to sign in. Changing this will update your Oxford ID.');
        $('#form-group-email').css({ display: 'block' });
        $('#edit-email-guide').text('We will use this to contact you if necessary');
    } else {
        $('#edit-username-guide').text('This is the email address you use to sign in. Changing this will update your Oxford ID. We will use this to contact you if necessary.');
        $('#form-group-email').css({ display: 'none' });
        $('#edit-email-guide').text('');
    }
}

function bindEvents() {
    const user = ipcRenderer.sendSync('rdp-user');
    const isLegacy = (user.userName !== user.email);

    $('#user-profile-new-username, #user-profile-new-email, #user-profile-new-password, #user-profile-confirm-password').bind('change', () => {
        $('#submit-edit-credentials').attr('disabled', false);
    });

    ipcRenderer.removeAllListeners('action-change-sign-details-response');
    ipcRenderer.on('action-change-sign-details-response', (event, res) => {
        document.getElementById('loading-background').style.display = 'none';

        if (res.success && res.body?.status === 'success') {
            profileWidget.invalidate();
            rightPanel.openPanel('right-edit-confirm');

        } else if (res.body?.message.indexOf('[1044][') > 0) {
            $('#user-profile-new-password').parent().removeClass('form-validation-error');
            $('#user-profile-new-password').parent().removeClass('form-validation-correct');
            $('#user-profile-new-password').parent().removeClass('validation-none');
            $('#user-profile-new-password').parent().addClass('form-validation-error');
            $('.password-error').show();
            $('.password-error').children('li').text(messages.password_same_to_previous);

        } else if (res.body?.message.indexOf('[2039][') > 0) {
            $('#user-profile-new-username').parent().removeClass('form-validation-error');
            $('#user-profile-new-username').parent().removeClass('form-validation-correct');
            $('#user-profile-new-username').parent().removeClass('validation-none');
            $('#user-profile-new-username').parent().addClass('form-validation-error');
            $('.username-error').show();
            $('.username-error').children('li').text(messages.username_already_exist);
        }
    });

    const rules = ipcRenderer.sendSync('rdp-ces-rules');

    $.validator.addMethod('validUsername', (value) => new RegExp(rules.name).test(value));

    $.validator.addMethod('validEmail', (value) => new RegExp(rules.email).test(value));

    $.validator.addMethod('emailRegistered', (value) => {
        if (value === user.userName) return true;

        return !ipcRenderer.sendSync('action-check-email-registered', value);
    });

    $.validator.addMethod('validChangePassword', (value) => {
        if (value === '') {
            return true;
        }
        return new RegExp(rules.password).test(value);
    });

    $('#submit-form-edit-credentials').validate({
        rules: {
            username: {
                required: true,
                validEmail: true,
                emailRegistered: !isLegacy,
            },
            email: {
                required: true,
                validEmail: isLegacy,
            },
            newPassword: {
                validChangePassword: true
            },
            confirmPassword: {
                equalTo: '#user-profile-new-password'
            }
        },
        messages: {
            username: {
                required: messages.email_is_required,
                validEmail: messages.email_is_invalid,
                emailRegistered: messages.username_already_exist,
            },
            email: {
                required: messages.email_is_required,
                validEmail: messages.email_is_invalid,
            },
            newPassword: {
                validChangePassword: messages.password_is_invalid
            },
            confirmPassword: {
                equalTo: messages.password_not_equal
            }
        },
        onkeyup: false,
        success: beautifier.onValidateSuccess,
        errorPlacement: beautifier.onValidateFailed,

        onfocusout: (element) => {
            $(element).valid();
        },

        submitHandler: () => {
            document.getElementById('loading-background').style.display = 'block';

            const password = $('#user-profile-new-password').val();
            const email = isLegacy ? $('#user-profile-new-email').val() : $('#user-profile-new-username').val();
            const data = {
                userName: $('#user-profile-new-username').val(),
                oldPassword: $('#user-profile-org-password').val()
            };

            if (password) {
                data.newPassword = password;
            }
            ipcRenderer.send('action-change-sign-details-request', data, email);

            return false;
        },
    });
}

global.onEditCredentialPanelLoaded = () => {
    bindView();
    bindEvents();
};