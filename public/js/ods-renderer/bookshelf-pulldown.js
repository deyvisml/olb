"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jquery_1 = __importDefault(require("jquery"));
const electron_1 = require("electron");
const google_analytics_1 = __importDefault(require("./utils/google-analytics"));
const bookshelf_action_1 = __importDefault(require("./bookshelf-action"));
const download_status_1 = __importDefault(require("../ods-share/download-status"));
const collection_1 = __importDefault(require("./view/bookshelf/collection"));
const STATUS = {
    LICENSED: 'LICENSED',
    DOWNLOADING: 'DOWNLOADING',
    DOWNLOADED: 'DOWNLOADED',
    UNLICENSED: 'UNLICENSED',
};
const pulldown = {
    isOpened() {
        return ((0, jquery_1.default)('#dropdown-detail-box').css('display') === 'block');
    },
    isValidData(value) {
        return value && value !== 'null' && value !== 'undefined';
    },
    getCurrentBid() {
        const book = (0, jquery_1.default)('.olb-book-wrap.is-active');
        return (book && book[0] && book[0].getAttribute('data-book-bid'));
    },
    getStatus(book, bookView) {
        if (book.status === 'ASSIGNED_WITHOUT_CODE' || book.status === 'NOT_ACCESSIBLE')
            return STATUS.UNLICENSED;
        if (book.isDownloaded)
            return STATUS.DOWNLOADED;
        if (bookView[0].getAttribute('data-book-downloadstatus') === download_status_1.default.CANDIDATE) {
            return STATUS.LICENSED;
        }
        else {
            return STATUS.DOWNLOADING;
        }
    },
    decorateDate(date) {
        return new Date(date).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    },
    serializeLinks(book) {
        let html = '';
        for (const assignment of book.assignment) {
            if (html !== '')
                html += '<br/>';
            html += assignment.assignmentGroupName.join('<br/>');
        }
        return html;
    },
    bindDefaultDetails(book) {
        (0, jquery_1.default)('#dropdown-detail-box .title').text(book.title);
        (0, jquery_1.default)('#dropdown-detail-box .author').text(`Author: ${book.author}`);
        (0, jquery_1.default)('#dropdown-detail-box .author').css('display', this.isValidData(book.author) ? 'block' : 'none');
        (0, jquery_1.default)('#dropdown-detail-box .description').text(book.description);
        (0, jquery_1.default)('#dropdown-detail-box .cefr-level').text(`CEFR: ${book.cefrLevel}`);
        (0, jquery_1.default)('#dropdown-detail-box .cefr-level').css('display', this.isValidData(book.cefrLevel) ? 'block' : 'none');
        (0, jquery_1.default)('#dropdown-detail-box .words-count').text(`${book.wordCount} words`);
        (0, jquery_1.default)('#dropdown-detail-box .words-count').css('display', (book.type.readers && book.wordCount > 0) ? 'block' : 'none');
        (0, jquery_1.default)('#dropdown-detail-box .file-size').text(`File size: ${book.size} MB`);
        (0, jquery_1.default)('#dropdown-detail-box .file-size').css('display', (book.size > 0) ? 'block' : 'none');
        (0, jquery_1.default)('#dropdown-detail-box .updated').text(`Last updated: ${this.decorateDate(book.updatedDate)}`);
        (0, jquery_1.default)('#dropdown-detail-box .updated').css('display', this.isValidData(book.updatedDate) ? 'block' : 'none');
        (0, jquery_1.default)('#dropdown-detail-box .expired-date').text(`Expires: ${this.decorateDate(book.license.expiryDate)}`);
        (0, jquery_1.default)('#dropdown-detail-box .expired-date').css('display', this.isValidData(book.license.expiryDate) ? 'block' : 'none');
        (0, jquery_1.default)('#dropdown-detail-box .olb-book-open').attr('data-book-id', book.id);
        (0, jquery_1.default)('#dropdown-detail-box .olb-book-open').attr('data-book-zip', book.zipDownloadUrl);
    },
    bindCPTDetails(book) {
        if (book.type.classroomPresentation) {
            (0, jquery_1.default)('#dropdown-detail-box .cpt-wrap').show();
        }
        else {
            (0, jquery_1.default)('#dropdown-detail-box .cpt-wrap').hide();
        }
    },
    bindAssignDetails(book) {
        if (book.assignment?.find(assignment => assignment.assignmentGroupName.length > 0)) {
            (0, jquery_1.default)('#dropdown-detail-box .links').css('display', 'block');
            (0, jquery_1.default)('#dropdown-detail-box .links').html(`Linked to: ${this.serializeLinks(book)}`);
        }
        else {
            (0, jquery_1.default)('#dropdown-detail-box .links').css('display', 'none');
        }
    },
    hideAllButtons() {
        (0, jquery_1.default)('#olb-book-download-button').hide().unbind();
        (0, jquery_1.default)('#olb-book-open-button').hide().unbind();
        (0, jquery_1.default)('#olb-book-cancel-button').hide().unbind();
        (0, jquery_1.default)('#olb-book-delete-button').hide().unbind();
        (0, jquery_1.default)('#olb-book-add-button').hide().unbind();
        (0, jquery_1.default)('#olb-book-buy-button').hide().unbind();
    },
    bindButtonStatus(book, status, collection) {
        this.hideAllButtons();
        switch (status) {
            case STATUS.DOWNLOADED:
                (0, jquery_1.default)('#olb-book-open-button').show();
                (0, jquery_1.default)('#olb-book-open-button').bind('click', () => {
                    bookshelf_action_1.default.openBook(book.id, collection.title);
                });
                (0, jquery_1.default)('#olb-book-delete-button').show();
                (0, jquery_1.default)('#olb-book-delete-button').bind('click', () => {
                    bookshelf_action_1.default.showDeleteBook(book.id);
                });
                break;
            case STATUS.UNLICENSED:
                const ecommerceURL = (collection.id === collection_1.default.MY_BOOKS_COLLECTION)
                    ? book.eCommerceUrl : collection.eCommerceUrl;
                (0, jquery_1.default)('#olb-book-add-button').show();
                (0, jquery_1.default)('#olb-book-add-button').bind('click', () => {
                    bookshelf_action_1.default.showAddBook();
                });
                if (this.isValidData(ecommerceURL)) {
                    (0, jquery_1.default)('#olb-book-buy-button').show();
                    (0, jquery_1.default)('#olb-book-buy-button').bind('click', () => {
                        global.openBrowser(ecommerceURL);
                        bookshelf_action_1.default.showAddBook();
                    });
                }
                break;
            case STATUS.DOWNLOADING:
                (0, jquery_1.default)('#olb-book-download-button').show();
                this.bindDownloadProgress(book.id, (0, jquery_1.default)(`#book-data-${book.id}`).attr('data-book-downloadstatus'), 0);
                break;
            case STATUS.LICENSED:
            default:
                (0, jquery_1.default)('#olb-book-download-button span').text('Download');
                (0, jquery_1.default)('#olb-book-download-button .radial-progress').hide();
                (0, jquery_1.default)('#olb-book-download-button .cloud-download').show();
                (0, jquery_1.default)('#olb-book-download-button').show();
                (0, jquery_1.default)('#olb-book-download-button').bind('click', () => {
                    bookshelf_action_1.default.downloadBook(book);
                });
                break;
        }
    },
    bindDownloadProgress(bookId, status, progress) {
        switch (status) {
            case download_status_1.default.PROGRESSING:
            case download_status_1.default.PAUSED:
            case download_status_1.default.WAITING:
                if ((0, jquery_1.default)('#dropdown-detail-box').is(':visible')) {
                    (0, jquery_1.default)('#olb-book-download-button .radial-progress').attr('data-progress', progress);
                }
                (0, jquery_1.default)('#olb-book-download-button .cloud-download').hide();
                (0, jquery_1.default)('#olb-book-download-button .radial-progress').show();
                (0, jquery_1.default)('#olb-book-download-button span').text(download_status_1.default.getDisplayText(status));
                break;
            case download_status_1.default.PRIOR_TASK:
            case download_status_1.default.EXTRACTING:
                if ((0, jquery_1.default)('#dropdown-detail-box').is(':visible')) {
                    (0, jquery_1.default)('#olb-book-download-button .radial-progress').attr('data-progress', 'indeterminate');
                }
                (0, jquery_1.default)('#olb-book-download-button .cloud-download').hide();
                (0, jquery_1.default)('#olb-book-download-button .radial-progress').show();
                (0, jquery_1.default)('#olb-book-download-button span').text(download_status_1.default.getDisplayText(status));
                break;
            case download_status_1.default.CANCELED:
                (0, jquery_1.default)('#olb-book-download-button .radial-progress').hide();
                pulldown.invalidate(bookId, STATUS.LICENSED);
                break;
            case download_status_1.default.COMPLETED:
                (0, jquery_1.default)(`#book-update-${bookId}`).addClass('latest');
                (0, jquery_1.default)('#olb-book-download-button .radial-progress').hide();
                pulldown.invalidate(bookId, STATUS.DOWNLOADED);
                break;
        }
        if (status === download_status_1.default.PROGRESSING || status === download_status_1.default.PAUSED) {
            (0, jquery_1.default)('#olb-book-download-button').unbind();
            (0, jquery_1.default)('#olb-book-download-button').bind('click', () => {
                if (status === download_status_1.default.PROGRESSING) {
                    electron_1.ipcRenderer.send('download-book-pause', bookId);
                }
                else if (status === download_status_1.default.PAUSED) {
                    electron_1.ipcRenderer.send('download-book-resume', bookId);
                }
            });
            (0, jquery_1.default)('#olb-book-cancel-button').show().unbind();
            (0, jquery_1.default)('#olb-book-cancel-button').bind('click', () => {
                electron_1.ipcRenderer.send('download-book-cancel', bookId);
            });
        }
        else {
            (0, jquery_1.default)('#olb-book-cancel-button').hide().unbind();
        }
    },
    addOverlayToSelectedTitle(book) {
        (0, jquery_1.default)('.olb-book-wrap').removeClass('is-active'); // clear previous selection
        book.addClass('is-active');
    },
    getBookContainer(book) {
        let container = (0, jquery_1.default)(book).closest('.olb-book-collection');
        if (container == null || container.length === 0) {
            container = (0, jquery_1.default)(book).closest('.olb-search-result');
        }
        return container;
    },
    getBooksFromContainer(container) {
        const cells = container.find('.olb-book-wrap'); // return array-like object.
        return cells.filter((idx) => {
            return (cells[idx].style.display !== 'none');
        });
    },
    addAlignBox(book, books, columns) {
        const index = (0, jquery_1.default)(books).index((0, jquery_1.default)(book));
        const maxRow = Math.floor(books.length / columns) + 1;
        const row = Math.floor(index / columns) + 1;
        let offset = row * columns - 1;
        if (row === maxRow) {
            offset = books.length - 1;
        }
        (0, jquery_1.default)(books[offset]).after((0, jquery_1.default)('#dropdown-align-box'));
    },
    showPulldownDetailBox(book) {
        const detailHeight = 281;
        const alignHeight = 261;
        const cellHeight = 225;
        const cellTop = book[0].offsetTop;
        (0, jquery_1.default)('#dropdown-detail-box').css({
            display: 'block',
            top: `${cellTop + cellHeight}px`
        });
        setTimeout(() => {
            const top = (detailHeight - (0, jquery_1.default)('#dropdown-detail-box .wrap').height()) / 2;
            (0, jquery_1.default)('#dropdown-align-box').css('height', alignHeight);
            (0, jquery_1.default)('#dropdown-detail-box').css('height', detailHeight);
            (0, jquery_1.default)('#dropdown-detail-box .wrap').css('margin-top', Math.min(75, top));
        }, 1);
    },
    open(e) {
        const bookView = (0, jquery_1.default)(e.target).closest('.olb-book-wrap');
        const bid = bookView[0].getAttribute('data-book-bid');
        const collection = this.getCollection(bookView, bid);
        const book = electron_1.ipcRenderer.sendSync('rdp-book', bid, collection.id);
        const status = this.getStatus(book, bookView);
        const container = this.getBookContainer(bookView);
        const bookViews = this.getBooksFromContainer(container);
        const columns = (0, jquery_1.default)(window).width() > 1099 ? 5 : 4;
        this.bindDefaultDetails(book);
        this.bindCPTDetails(book);
        this.bindAssignDetails(book);
        this.bindButtonStatus(book, status, collection);
        this.addOverlayToSelectedTitle(bookView);
        this.addAlignBox(bookView, bookViews, columns);
        this.showPulldownDetailBox(bookView);
        google_analytics_1.default.sendEvent(google_analytics_1.default.CATEGORY.BOOKSHELF, google_analytics_1.default.ACTION.DETAIL, bid);
    },
    close() {
        (0, jquery_1.default)('.olb-book-wrap').removeClass('is-active');
        (0, jquery_1.default)('#dropdown-detail-box').css('height', 0);
        (0, jquery_1.default)('#dropdown-detail-box').css('display', 'none');
        (0, jquery_1.default)('#dropdown-align-box').css('height', 0);
        (0, jquery_1.default)('#dropdown-align-box').parent().append('<div id="dropdown-align-box" style="height: 0;"></div>');
        (0, jquery_1.default)('#dropdown-align-box').remove();
    },
    toggle(e) {
        if (this.isOpened()) {
            this.close();
        }
        else {
            this.open(e);
        }
    },
    invalidate(bookId, status = null) {
        const bookView = (0, jquery_1.default)('.olb-book-wrap.is-active');
        if (bookView && bookView[0] && bookView[0].getAttribute('data-book-bid') === bookId) {
            const collection = this.getCollection(bookView, bookId);
            const book = electron_1.ipcRenderer.sendSync('rdp-book', bookId, collection.id);
            if (status == null) {
                status = this.getStatus(book, bookView);
            }
            this.bindButtonStatus(book, status, collection);
        }
    },
    bindEvents() {
        electron_1.ipcRenderer.on('book-downloading', (event, bid, progress, status) => {
            if (this.isOpened() && this.getCurrentBid() === bid) {
                this.bindDownloadProgress(bid, status, progress);
            }
        });
        electron_1.ipcRenderer.on('book-download-failed', (event, bookId, progress, status) => {
            if (this.isOpened() && this.getCurrentBid() === bookId) {
                const book = electron_1.ipcRenderer.sendSync('rdp-book', bookId);
                this.bindButtonStatus(book, status);
            }
        });
        electron_1.ipcRenderer.on('delete-book-response', (event, bid) => {
            pulldown.invalidate(bid, STATUS.LICENSED);
        });
        document.getElementById('bookshelf-close-pulldown').addEventListener('click', () => {
            pulldown.close();
        });
    },
    getCollection(bookView, bookId) {
        const collectionTitle = bookView[0].getAttribute('data-collection-title');
        let collection = electron_1.ipcRenderer.sendSync('rdp-collection', {
            key: 'title',
            value: collectionTitle,
        });
        // If the pulldown is opened from the search result, the collectionTitle can be null.
        if (collection == null) {
            collection = electron_1.ipcRenderer.sendSync('rdp-collection-contain-bid', { bid: bookId });
        }
        return collection;
    }
};
pulldown.bindEvents();
function open(e) {
    pulldown.open(e);
}
function close() {
    pulldown.close();
}
function toggle(e) {
    if (e.target.classList.contains('olb-book-cloud-info') || e.target.classList.contains('olb-book-device-info')) {
        const bookView = (0, jquery_1.default)(e.target).closest('.olb-book-wrap');
        const bid = (bookView[0] && bookView[0].getAttribute('data-book-bid'));
        if (pulldown.getCurrentBid() === bid) {
            pulldown.close();
        }
        else {
            pulldown.open(e);
        }
    }
}
const exportObject = {
    open,
    close,
    toggle,
};
exports.default = exportObject;
module.exports = exportObject;
