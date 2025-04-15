"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jquery_1 = __importDefault(require("jquery"));
const electron_1 = require("electron");
const file_io_1 = __importDefault(require("../../../utils/file-io"));
const google_analytics_1 = __importDefault(require("../../utils/google-analytics"));
const download_status_1 = __importDefault(require("../../../ods-share/download-status"));
const ods_messages_1 = __importDefault(require("../../../ods-share/ods-messages"));
const bookshelf_action_1 = __importDefault(require("../../bookshelf-action"));
const collection_1 = __importDefault(require("./collection"));
// noinspection JSJQueryEfficiency
class BookView {
    book;
    collection;
    readComplete;
    invalid;
    fromSearchResult;
    constructor(book, collection = null, fromSearchResult = false) {
        this.book = book;
        this.readComplete = book.readingDiary?.complete ?? false;
        this.invalid = book.id == null || book.title == null;
        this.collection = collection;
        this.fromSearchResult = fromSearchResult;
    }
    get domId() {
        return `book-data-${this.book.id}`;
    }
    get statusClass() {
        return this.book.readingDiary?.complete ? 'olb-diary-book-cover-finished' : 'olb-diary-book-cover-progress';
    }
    isReadProgressChanged(previous, current) {
        return (previous?.readingDiary?.progress !== current?.readingDiary?.progress);
    }
    isContainedDefaultCollection() {
        return this.collection.id === 'myBooks';
    }
    setCollection(collection) {
        this.collection = collection;
    }
    renderBook() {
        if (this.invalid)
            return '';
        const expired = this.book.status === 'EXPIRED';
        const downloaded = this.book.isDownloaded;
        const published = new Date(this.book.publishDate) <= new Date();
        const licenced = this.book.accessible;
        const unlicensed = this.isNotPurchased();
        const teacherResourceId = this.book.teacherResourceId;
        return `<div id="${this.domId}" class="olb-book-wrap ${expired ? 'expired' : ''} ${unlicensed ? 'assigned' : ''}" ${this.renderDataAttributes(downloaded, licenced)}>
                    ${this.renderReadingProgress(this.book.readingDiary?.progress)}
                    ${this.renderTeacherResource(teacherResourceId, expired, unlicensed)}

                    <div id="book-view-body" class="olb-diary-book-cover ${this.statusClass}">
                        ${this.renderHeadline(expired, this.readComplete)}
                        
                        ${this.renderCPTIcon()}
                        
                        ${this.renderForm(expired, published)}
                        
                        ${this.renderOverlay(expired, published)}
                        
                        ${this.renderAlarmIcon(this.book.updateRequired)}
                    </div>
                </div>`;
    }
    renderDataAttributes(downloaded, licenced) {
        const status = downloaded ? download_status_1.default.COMPLETED : download_status_1.default.CANDIDATE;
        return `data-book-bid="${this.book.id}"
                data-book-licenced="${licenced}"
                data-book-title="${this.book.title}"
                data-book-cefr="${this.book.cefrLevel}"
                data-book-expiry-date="${this.book.license.expiryDate}"
                data-book-downloaded="${downloaded}"
                data-book-downloadstatus="${status}"
                data-collection-title="${this.collection.title}"`;
    }
    renderReadingProgress(readingProgress) {
        if (this.book.type.readers && 0 <= readingProgress && readingProgress < 100) {
            return `<div id="book-read-progress" class="olb-diary-progress-bar">
                        <div id="book-read-progress-bar" class="olb-diary-progress-bar-inner" style="width: ${readingProgress}%"></div>
                    </div>`;
        }
        return '';
    }
    renderTeacherResource(teacherResourceId, expired, unlicensed) {
        if (teacherResourceId && !expired) {
            return `<button class="btn btn-primary olb-book-tr-link ${unlicensed ? 'disabled' : ''}"
                        data-teacher-resource-id="${teacherResourceId}">
                      Resources
                      <img src="../images/icons/links/icon-link-arrow-white.svg" alt>
                    </button>`;
        }
        return '';
    }
    renderHeadline(expired, readComplete) {
        if (expired) {
            return '<p class="olb-diary-book-text-progress">Expired</p>';
        }
        else if (readComplete) {
            return '<p class="olb-diary-book-text-progress">Completed book</p>';
        }
        return '';
    }
    renderOverlay(expired, published) {
        if (expired || !published)
            return '';
        return `<div class="olb-book-overlay">
                    <button class="olb-book-read" title="Open book" id="${this.book.id}">
                        <span class="icon"></span>
                    </button>
                    <div class="olb-book-device-info" title="More information about this book"></div>
                    <div class="olb-book-cloud-info" title="More information about this book and download the book"></div>
                </div>`;
    }
    renderCPTIcon() {
        if (this.book.type.classroomPresentation) {
            return `<div class="olb-book-cover-cpt">
                        <div class="olb-book-cover-cpt-icon"></div>
                    </div>`;
        }
        return '';
    }
    renderAlarmIcon(updateRequired) {
        const latest = updateRequired ? '' : 'latest';
        return `<button id="book-update-${this.book.id}" class="olb-book-update-badge ${latest}"/>`;
    }
    renderForm(expired, published) {
        const html = [];
        const thumbnail = file_io_1.default.exist(this.book.thumbnailFilepath) ? this.book.thumbnailFilepath : this.book.thumbnailUrl;
        const titleAttr = published ? 'aria-hidden="true"' : '';
        if (expired) {
            html.push('<form class="olb-book-container olb-book-expired">');
        }
        else if (!published) {
            html.push('<form class="olb-book-container olb-book-expired olb-book-soon">');
        }
        else {
            html.push('<form class="olb-book-container" name="form_" id="form_" action="#" method="post" target="my_iframe">');
        }
        if (!published && !this.invalid) {
            html.push(`<div class="olb-book-soon-wrap">
                           <div class="olb-book-soon-overlay"></div>
                           <div class="olb-book-soon-banner">Coming soon</div>
                       </div>`);
        }
        html.push(`<a href="javascript:;">
                       <input type="hidden" name="client_id" id="client_id" value="OLB_WEB_EAC"/>
                       <input type="hidden" name="cipher_text" id="cipher_text" value=""/>
                   </a>
                   <img src="${thumbnail}" class="olb-book-cover" alt="${this.book.title}"/>
                   <h2 class="olb-book-title" ${titleAttr}>${this.book.title || ''}</h2>`);
        html.push('</form>');
        return html.join('');
    }
    invalidateBook(book, parent) {
        if (book?.id == null || book?.title == null)
            return;
        this.invalidateStatus(book, parent);
        if (book.readingDiary != null) {
            if (!this.readComplete && book.readingDiary.complete) {
                this.invalidateReadStatus(book.readingDiary.complete, parent);
            }
            else if (this.isReadProgressChanged(this.book, book)) {
                this.invalidateReadProgress(book.readingDiary.progress, parent);
            }
        }
        if (book.updateRequired) {
            parent.querySelector(`#book-update-${book.id}`).classList.remove('latest');
        }
        else {
            parent.querySelector(`#book-update-${book.id}`).classList.add('latest');
        }
        this.readComplete = book.readingDiary?.complete ?? false;
        this.book = book;
    }
    invalidateStatus(book, parent) {
        const element = parent.querySelector(`#${this.domId}`);
        if (element != null) {
            element.classList.toggle('expired', Boolean(book.status === 'EXPIRED'));
            element.classList.toggle('downloaded', Boolean(book.isDownloaded));
        }
    }
    invalidateReadStatus(readComplete, parent) {
        const id = this.domId;
        if (parent.querySelector(`#${id} #book-read-progress`) != null) {
            parent.querySelector(`#${id} #book-read-progress`).remove();
        }
        parent.querySelector(`#${id} #book-view-body`).classList.remove('olb-diary-book-cover-progress');
        parent.querySelector(`#${id} #book-view-body`).classList.add('olb-diary-book-cover-finished');
        parent.querySelector(`#${id} #book-view-body`)
            .insertAdjacentElement('afterbegin', this.htmlToElements(this.renderHeadline(false, readComplete)));
        google_analytics_1.default.sendEvent(google_analytics_1.default.CATEGORY.BOOKSHELF, google_analytics_1.default.ACTION.AWARD, this.book.id, {
            bid: this.book.id,
            isbn: this.book.isbn,
            cefr_level: this.book.cefrLevel,
            collection: this.collection.title,
        });
    }
    invalidateReadProgress(readingProgress, parent) {
        const id = this.domId;
        if (parent.querySelector(`#${id} #book-read-progress-bar`) == null) {
            parent.querySelector(`#${id}`).insertAdjacentElement('afterbegin', this.htmlToElements(this.renderReadingProgress(readingProgress)));
        }
        else {
            // @ts-ignore
            parent.querySelector(`#${id} #book-read-progress-bar`).style.width = `${readingProgress}%`;
        }
    }
    htmlToElements(htmlString) {
        const html = new DOMParser().parseFromString(htmlString, 'text/html');
        return html?.body?.childNodes[0] ?? null;
    }
    bindEvents() {
        // If the same book exists on multiple collections, the parent must be specified.
        const domSelector = `${this.getParentDomSelector()} #${this.domId}`;
        (0, jquery_1.default)(`${domSelector} .olb-book-read`).unbind();
        (0, jquery_1.default)(`${domSelector} .olb-book-read`).bind('click', this.onOpenBook.bind(this));
        (0, jquery_1.default)(`${domSelector} .olb-book-update-badge`).unbind('click');
        (0, jquery_1.default)(`${domSelector} .olb-book-update-badge`).bind('click', (e) => {
            e.stopPropagation();
            bookshelf_action_1.default.updateBook(this.book.id, this.book.zipDownloadUrl, e);
        });
        (0, jquery_1.default)(`${domSelector} .olb-book-tr-link`).unbind('click');
        (0, jquery_1.default)(`${domSelector} .olb-book-tr-link`).bind('click', this.onTeacherResourceClicked.bind(this));
        if (this.book && this.book.status === 'EXPIRED') {
            (0, jquery_1.default)(`${domSelector}`).unbind();
            (0, jquery_1.default)(`${domSelector}`).bind('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.openNoLicenseModal();
            });
        }
    }
    onOpenBook(e) {
        e.stopPropagation();
        e.preventDefault();
        if (this.book.status === 'IN_PRODUCTION') {
            const date = this.book.publishDate.split('-');
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            alert(`This will be available from: ${date[2]} ${months[parseInt(date[1], 10) - 1]} ${date[0]}`);
            return;
        }
        if (this.book.status === 'EXPIRED')
            return;
        if (this.isNotPurchased()) {
            this.openNoLicenseModal();
        }
        else {
            bookshelf_action_1.default.openBook(this.book.id, this.collection.title);
        }
    }
    onTeacherResourceClicked(e) {
        e.stopPropagation();
        if (navigator.onLine) {
            if (this.isNotPurchased()) {
                this.openNoLicenseModal();
            }
            else {
                const teacherResourceId = e.target.getAttribute('data-teacher-resource-id');
                if (electron_1.ipcRenderer.sendSync('rdp-user-preference', 'teacher-resource-terms-accepted')) {
                    this.openTeacherResourceModal(teacherResourceId);
                }
                else {
                    this.openTeacherResourceTermsAgreementModal(teacherResourceId);
                }
            }
        }
        else {
            alert(ods_messages_1.default.network_connection_required);
        }
    }
    isNotPurchased() {
        return (this.book.status === 'ASSIGNED_WITHOUT_CODE' || this.book.status === 'NOT_ACCESSIBLE');
    }
    getParentDomSelector() {
        if (this.fromSearchResult) {
            return '.olb-search-result';
        }
        else {
            const collectionId = this.collection.id || collection_1.default.MY_BOOKS_COLLECTION;
            return `#olb-book-collection-${collectionId}`;
        }
    }
    applyFilter(filter, parent) {
        const filtered = this.isFiltered(filter);
        const element = parent.querySelector(`#${this.domId}`);
        if (element?.style) {
            element.style.display = filtered ? 'none' : 'inline-block';
        }
    }
    isFiltered(filter) {
        let filtered = false;
        if (filter && filter.sample) {
            filtered = this.isSample();
        }
        if (filter && filter.expired && !filtered) {
            filtered = this.book.license.expired;
        }
        if (filter && filter.unlicensed && !filtered) {
            filtered = this.isNotPurchased();
        }
        if (filter && filter.active && !filtered) {
            filtered = !this.book.license.expired && !this.isNotPurchased() && !this.isSample();
        }
        return filtered;
    }
    isSample() {
        const title = this.book.title;
        return /[([]sample|^sample\s|\ssample\s|\ssample$/i.test(title)
            || /[([]demo|^demo\s|\sdemo\s|\sdemo$/i.test(title);
    }
    openNoLicenseModal() {
        const ecommerceURL = this.isContainedDefaultCollection()
            ? this.book.eCommerceUrl
            : this.collection.eCommerceUrl;
        bookshelf_action_1.default.showNoLicense(this.book, ecommerceURL);
    }
    openTeacherResourceModal(teacherResourceId) {
        bookshelf_action_1.default.openTeacherResourcePanel(teacherResourceId, this.book, this.collection.title);
    }
    openTeacherResourceTermsAgreementModal(teacherResourceId) {
        (0, jquery_1.default)('#modal-window').load('./modal/modal-teacher-resource-terms.html', () => {
            (0, jquery_1.default)('#tr-accept-terms').bind('click', () => {
                electron_1.ipcRenderer.send('action-teacher-resource-accept-terms');
                this.openTeacherResourceModal(teacherResourceId);
            });
        });
        // @ts-ignore
        (0, jquery_1.default)('#modal-window').modal();
    }
}
exports.default = BookView;
module.exports = BookView;
