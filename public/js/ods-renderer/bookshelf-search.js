"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const google_analytics_1 = __importDefault(require("./utils/google-analytics"));
const bookshelf_filter_1 = __importDefault(require("./bookshelf-filter"));
const book_1 = __importDefault(require("./view/bookshelf/book"));
function removeElement(selector) {
    if (document.querySelector(selector)?.parentNode) {
        document.querySelector(selector).parentNode.removeChild(document.querySelector(selector));
    }
}
function clearPreviousSearchResult() {
    document.querySelectorAll('.olb-book-collection').forEach((collection) => {
        collection.style.display = 'block';
    });
    document.querySelector('#olb-book-content').appendChild(document.querySelector('#dropdown-align-box'));
    removeElement('.no-item');
    removeElement('.olb-search-result');
}
function hideCollections() {
    document.querySelectorAll('.olb-book-collection').forEach((collection) => {
        collection.style.display = 'none';
    });
}
function showNoSearchResult() {
    const dom = new DOMParser().parseFromString(`<div class="no-item">We didn't find any books for this search.<br>Please try a different search.</div>`, 'text/html'); // eslint-disable-line
    document.querySelector('.olb-book-main-wrap').appendChild(dom.body.firstChild);
}
function hasGreatestExpiryDate(firstDate, secondDate) {
    if (firstDate == null || firstDate === '' || firstDate === 'undefined')
        return true;
    if (secondDate == null || secondDate === '' || secondDate === 'undefined')
        return false;
    return new Date(firstDate) > new Date(secondDate);
}
function getSearchResult(keyword) {
    const result = new Map();
    const collections = electron_1.ipcRenderer.sendSync('rdp-collections');
    for (const collection of collections) {
        for (const book of collection.books) {
            if ((book.title && book.title.toLowerCase().includes(keyword))
                || (book.cefrLevel && book.cefrLevel.toLowerCase().includes(keyword))) {
                if (result.has(book.id)) {
                    const exist = result.get(book.id).book;
                    if (exist.status == 'EXPIRED' && book.status != 'EXPIRED') {
                        result.set(book.id, { book, collection });
                    }
                    else if (exist.status == 'ASSIGNED_WITHOUT_CODE' && (book.status != 'EXPIRED' && book.status != 'BookStatus.ASSIGNED_WITHOUT_CODE')) {
                        result.set(book.id, { book, collection });
                    }
                    else if (hasGreatestExpiryDate(book.license.expiryDate, exist.expiryDate)) {
                        result.set(book.id, { book, collection });
                    }
                }
                else {
                    result.set(book.id, { book, collection });
                }
            }
        }
    }
    return Array.from(result.values());
}
function bindBookViews(searchResults) {
    const views = [];
    if (searchResults && searchResults.length > 0) {
        searchResults.forEach((result) => {
            views.push(new book_1.default(result.book, result.collection, true));
        });
    }
    return views;
}
function filterBookViews(views, filter) {
    const filtered = [];
    for (const view of views) {
        if (!view.isFiltered(filter)) {
            filtered.push(view);
        }
    }
    return filtered;
}
function renderSearchResult(results) {
    hideCollections();
    const filter = bookshelf_filter_1.default.getFilter();
    let views = bindBookViews(results);
    let html = '';
    views = filterBookViews(views, filter);
    if (views && views.length > 0) {
        views.forEach((view) => { html += view.renderBook(); });
        const dom = new DOMParser().parseFromString(`<div class="olb-search-result">
                                                       <div class="olb-book-shelf-bg">
                                                         <div class="olb-book-center two-block">${html}</div>
                                                       </div>
                                                     </div>`, 'text/html');
        document.getElementById('olb-book-content').appendChild(dom.body.firstChild);
        views.forEach((view) => {
            view.bindEvents();
        });
    }
    else {
        showNoSearchResult();
    }
}
function submit(keyword) {
    clearPreviousSearchResult();
    renderSearchResult(getSearchResult(keyword));
    google_analytics_1.default.sendEvent(google_analytics_1.default.CATEGORY.BOOKSHELF, google_analytics_1.default.ACTION.SEARCH, keyword);
}
const exportObject = {
    submit,
    clearPreviousSearchResult,
};
exports.default = exportObject;
module.exports = exportObject;
