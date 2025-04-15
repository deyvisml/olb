const $ = require('jquery');
const { ipcRenderer } = require('electron');
const messages = require('../../../ods-share/ods-messages');
const beautifier = require('../../utils/data-beautifier');

$(document).ready(() => {
    $('#toc').hide();
});

ipcRenderer.on('action-register-partial-response', (event, result) => {
    $('#loading-background').hide();

    if (result.success && result.body?.status === 'success') {
        const user = ipcRenderer.sendSync('rdp-user');
        const firstName = beautifier.getFirstnameWithFrontSpace(user.firstname);

        $('#modal').load('./modal/modal-toc-confirm.html', () => {
            $('.success-first-name').text(firstName);
        });
    }
});

$('#submit-partial-register').validate({
    ignore: [],
    rules: {
        toc: {
            required: true
        }
    },
    messages: {
        toc: {
            required: messages.toc_is_not_agreed,
        }
    },
    success: beautifier.onValidateSuccess,
    errorPlacement: beautifier.onValidateFailed,

    submitHandler() {
        $('#loading-background').show();

        ipcRenderer.send('action-register-partial-request');

        return false;
    },
});