"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jquery_1 = __importDefault(require("jquery"));
const electron_1 = require("electron");
const google_analytics_1 = __importDefault(require("./utils/google-analytics"));
const ods_messages_1 = __importDefault(require("../ods-share/ods-messages"));
const add_book_1 = __importDefault(require("./view/bookshelf/add-book"));
function isValidAccessCode(accessCode) {
    return (accessCode && accessCode.length === 12 && accessCode.match(/[0-9A-z]{12}/g).length > 0)
        || (accessCode && accessCode.length === 14 && accessCode.match(/[0-9A-z]{4}-[0-9A-z]{4}-[0-9A-z]{4}/g).length > 0);
}
function getAssignedCode(book) {
    return book?.assignment?.find(assignment => assignment?.activationCode)?.activationCode || null;
}
function hasValidAccessCode(book) {
    const code = getAssignedCode(book);
    return code && isValidAccessCode(code);
}
function secureConsumingAccessCode(book) {
    if (book.status === "NEED_ACTIVATION") {
        electron_1.ipcRenderer.send('action-activation-request', getAssignedCode(book));
    }
}
function showAddBook() {
    (0, jquery_1.default)('#modal-window').load('./modal/modal-add-a-book.html', () => {
        add_book_1.default.onModalLoaded();
        google_analytics_1.default.screen(google_analytics_1.default.SCREEN.REDEEM);
    });
    // @ts-ignore
    (0, jquery_1.default)('#modal-window').modal();
}
function showDeleteBook(bookId) {
    (0, jquery_1.default)('#modal').load('./modal/modal-delete-confirm.html', () => {
        (0, jquery_1.default)('#submit-delete-book').unbind('click');
        (0, jquery_1.default)('#submit-delete-book').bind('click', () => {
            electron_1.ipcRenderer.send('delete-book-request', (0, jquery_1.default)('#modal').attr('delete-bid'));
        });
    });
    // @ts-ignore
    (0, jquery_1.default)('#modal').modal();
    (0, jquery_1.default)('#modal').attr('delete-bid', bookId);
}
function showNoLicense(book, ecommerceURL) {
    (0, jquery_1.default)('#modal-window').load('./modal/modal-no-licence-book.html', () => {
        (0, jquery_1.default)('#book-title').text(book.title);
        (0, jquery_1.default)('#book-thumbnail')
            .css('width', 104)
            .css('margin-top', 32)
            .css('border-radius', 8)
            .css('border', '1px solid #d9d9d9')
            .attr('src', book.thumbnailUrl);
        (0, jquery_1.default)('#book-redeem-code').bind('click', () => {
            showAddBook();
        });
        /**
         *  Purchase From ELT eCommerce Site is only available when the eCommerce URL for the book exists and clicked from default collection.
         */
        if (ecommerceURL && ecommerceURL !== 'null') {
            (0, jquery_1.default)('#book-commerce').show();
            (0, jquery_1.default)('#book-commerce').bind('click', () => {
                global.openBrowser(ecommerceURL);
            });
        }
    });
    // @ts-ignore
    (0, jquery_1.default)('#modal-window').modal();
}
function showBookNotFound() {
    (0, jquery_1.default)('#modal-window').load('./modal/modal-book-not-found.html');
    // @ts-ignore
    (0, jquery_1.default)('#modal-window').modal();
}
function openTeacherResourcePanel(teacherResourceId, book, collectionTitle) {
    const panelBaseURL = electron_1.ipcRenderer.sendSync('rdp-environment', 'CES_TR_PANEL_URL');
    global.openBrowser(`${panelBaseURL}/${teacherResourceId}`);
    google_analytics_1.default.sendEvent(google_analytics_1.default.CATEGORY.TEACHER_RESOURCE, google_analytics_1.default.ACTION.OPEN, book.id, {
        bid: book.id,
        isbn: book.isbn,
        cefr_level: book.cefrLevel,
        collection: collectionTitle,
        triggered_by: google_analytics_1.default.TRIGGERED_BY.BOOKSHELF
    });
}
function openBook(bookId, collectionTitle) {
    if (bookId.toLowerCase().includes('ntype')) {
        alert(ods_messages_1.default.ntype_is_not_available);
    }
    else if (bookId.toLowerCase().includes('epub')) {
        alert(ods_messages_1.default.book_no_longer_available);
    }
    else {
        const user = electron_1.ipcRenderer.sendSync('rdp-user');
        const book = electron_1.ipcRenderer.sendSync('rdp-book', bookId);
        secureConsumingAccessCode(book);
        electron_1.ipcRenderer.send('action-diary-hide-book', user.id, bookId, 0);
        electron_1.ipcRenderer.send('view-bookshelf-open-book', bookId, collectionTitle);
    }
}
function downloadBook(book) {
    if (navigator.onLine) {
        if (book.id.toLowerCase().startsWith('ntype')) {
            alert(ods_messages_1.default.ntype_is_not_available);
        }
        else if (book.id.toLowerCase().startsWith('epub')) {
            alert(ods_messages_1.default.book_no_longer_available);
        }
        else {
            secureConsumingAccessCode(book);
            electron_1.ipcRenderer.send('download-book-start', book.id, book.zipDownloadUrl);
        }
    }
    else {
        alert(ods_messages_1.default.network_connection_required);
    }
}
function updateBook(bookId, zipDownloadUrl, e) {
    (0, jquery_1.default)('#modal-window').load('./modal/modal-update-book.html', () => {
        (0, jquery_1.default)('#update-book').unbind('click');
        (0, jquery_1.default)('#update-book').bind('click', () => {
            electron_1.ipcRenderer.send('update-book-request', bookId, zipDownloadUrl);
            setTimeout(() => {
                const pulldown = require('./bookshelf-pulldown'); // eslint-disable-line
                pulldown.open(e);
            }, 160);
        });
    });
    // @ts-ignore
    (0, jquery_1.default)('#modal-window').modal();
}
electron_1.ipcRenderer.on('menu-add-book', () => {
    showAddBook();
});
const exportObject = {
    hasValidAccessCode,
    showAddBook,
    showDeleteBook,
    showNoLicense,
    showBookNotFound,
    openTeacherResourcePanel,
    openBook,
    downloadBook,
    updateBook,
};
exports.default = exportObject;
module.exports = exportObject;
