const $ = require('jquery');
const { ipcRenderer } = require('electron');
const messages = require('../../../ods-share/ods-messages');
const beautifier = require('../../utils/data-beautifier');

const rules = ipcRenderer.sendSync('rdp-ces-rules');

$.validator.addMethod('validEmail', (value) => {
    return new RegExp(rules.email).test(value);
});

$.validator.addMethod('validPassword', (value) => {
    return new RegExp(rules.password).test(value);
});

$.validator.addMethod('emailRegistered', (value) => {
    return !ipcRenderer.sendSync('action-check-email-registered', value);
});

$('#submit-legacy-signin').validate({
    ignore: [],
    rules: {
        userName: {
            required: true,
            validEmail: true,
            emailRegistered: true,
        },
        toc: {
            required: true
        }
    },
    messages: {
        userName: {
            required: messages.email_is_required,
            validEmail: messages.email_is_invalid,
            emailRegistered: messages.email_already_exist,
        },
        toc: {
            required: messages.toc_is_not_agreed
        }
    },
    success: beautifier.onValidateSuccess,
    errorPlacement: beautifier.onValidateFailed,

    submitHandler() {
        document.getElementById('loading-background').style.display = 'block';

        ipcRenderer.send('action-register-legacy-request', $('#userName').val());

        return false;
    },
});

ipcRenderer.on('action-register-legacy-response', (event, result) => {
    if (result.success && result.body?.status === 'success') {
        document.getElementById('loading-background').style.display = 'none';

        $('#modal').load('./modal/modal-toc-confirm.html', () => {
            const user = ipcRenderer.sendSync('rdp-user');
            const firstName = beautifier.getFirstnameWithFrontSpace(user.firstName);

            $('.success-first-name').text(firstName);
        });
    }
});