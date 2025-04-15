const { ipcRenderer } = require('electron');
const $ = require('jquery');
const dateFormat = require('dateformat');
const HypertextUtils = require('../../../utils/hypertext-utils');
const messages = require('../../../ods-share/ods-messages');
const EnvConfig = require('../../../config/env-config');

function showErrorMessage(message) {
    $('#addBookError').show();
    $('#addBookErrorMsg').text(message);
}

function hideErrorMessage() {
    $('#addBookError').hide();
}

function getExpiryInfo(expiryInfo) {
    if (expiryInfo == null || expiryInfo.date == null) return '';

    const date = dateFormat(new Date(expiryInfo.date), 'dd mmmm yyyy');

    return `<p class="added-book-expiry-date">Expires: ${date}</p>`;
}

function isValidAccessCode(accessCode) {
    return (accessCode.length === 12 && accessCode.match(/[0-9A-z]{12}/g))
        || (accessCode.length === 14 && accessCode.match(/[0-9A-z]{4}-[0-9A-z]{4}-[0-9A-z]{4}/g));
}

function addBook() {
    // noinspection JSUnresolvedReference
    grecaptcha.ready(async () => {
        try {
            const reCAPTCHASiteKey = EnvConfig.get(EnvConfig.OLBConfig.OLB_RECAPTCHA_SITE_KEY);
            const reCAPTCHAToken = await grecaptcha.execute(reCAPTCHASiteKey, { action: 'submit' });
            const accessCode = $('#add-book-redeem-code').val().trim();

            if (navigator.onLine === false) {
                alert(messages.network_connection_required);
                return;
            }
            if (accessCode === '') {
                showErrorMessage(messages.access_code_is_required);
                return;
            }

            if (isValidAccessCode(accessCode)) {
                document.getElementById('loading-background').style.display = 'block';

                ipcRenderer.send('action-redeem-request', accessCode, reCAPTCHAToken);
            } else {
                showErrorMessage(messages.access_code_is_invalid);
            }
        } catch (e) {
            console.error(e);
        }
    });
}

function getAddedBooks(books, collections, expiryInfo) {
    const html = [];
    const expiryView = getExpiryInfo(expiryInfo);

    // Add Collections in the code.
    if (collections && collections.length > 0) {
        for (const collection of collections) {
            if (collection == null || collection.title == null) continue;

            html.push(`<div class="added-book-wrap">
                           <div class="added-book-thumbnail">
                               <img src="${collection.thumb_url}" alt="${collection.title}"/>
                           </div>
                           <div class="added-book-meta-data">
                               <div class="lead added-book-title">${collection.title}</div>
                               <p class="added-book-description">${HypertextUtils.enableLinks(collection.description)}</p>
                               ${expiryView}
                           </div>
                           <div class="clear"></div>
                       </div>`);
        }
    }

    // Add Books in the code.
    if (books && books.length > 0) {
        for (const book of books) {
            if (book == null || book.title == null) continue;

            html.push(`<div class="added-book-wrap">
                           <div class="added-book-thumbnail">
                               <img src="${book.list_thumbnail}" alt="${book.title}"/>
                           </div>
                           <div class="added-book-meta-data">
                               <div class="lead added-book-title">${book.title}</div>
                               <p class="added-book-description">${HypertextUtils.enableLinks(book.description)}</p>
                               ${expiryView}
                           </div>
                           <div class="clear"></div>
                       </div>`);
        }
    }
    return html.join('');
}

function redeemComplete(event, res) {
    document.getElementById('loading-background').style.display = 'none';

    if (res.success && res.body?.status === 'success') {
        $('#modal-window').load('./modal/modal-add-a-book-confirmation.html', () => {
            $('#addedBooks').html(getAddedBooks(res.books, res.collections, res.licenseInfo));
        });
        $('#modal-window').modal();
    } else {
        let message;

        if (res.body?.message.indexOf('[1108]') !== -1) {
            message = messages.access_code_not_for_olb;
        } else if (res.body?.message.indexOf('[3120]') !== -1) {
            message = messages.access_code_is_invalid;
        } else if (res.body?.message.indexOf('[1123]') !== -1) {
            message = messages.access_code_is_not_found;
        } else if (res.body?.message.indexOf('[2053]') !== -1) {
            message = messages.access_code_already_used;
        } else if (res.body?.message.indexOf('[2054]') !== -1) {
            message = messages.access_code_is_expired;
        } else if (res.body?.message.indexOf('[2144]') !== -1 || res.body?.message.indexOf('[2150]') !== -1) {
            message = messages.access_code_is_assigned_to_org;
        } else if (res.body?.message.indexOf('[2143]') !== -1) {
            message = messages.access_code_already_licensed;
        } else if (res.body?.message.indexOf('[2007]') !== -1) {
            const date = new Date(res.body?.message.match(/([0-9]{4}-[0-9]{2}-[0-9]{2})/g));
            const time = dateFormat(date, 'dd mmmm yyyy');

            message = messages.access_code_not_activated(time);
        } else {
            message = messages.access_code_is_not_found;
        }
        showErrorMessage(message);
    }
}

function onModalLoaded() {
    document.getElementById('add-book-form').addEventListener('submit', (e) => {
        e.stopPropagation();
        e.preventDefault();

        addBook();
    });

    document.getElementById('add-book-submit').addEventListener('click', () => {
        addBook();
    });

    document.getElementById('add-book-redeem-code').addEventListener('keypress', () => {
        hideErrorMessage();
    });

    ipcRenderer.removeAllListeners('action-redeem-response');
    ipcRenderer.on('action-redeem-response', redeemComplete);
}

module.exports = {
    onModalLoaded
};