"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jquery_1 = __importDefault(require("jquery"));
const electron_1 = require("electron");
const book_1 = __importDefault(require("./book"));
class CollectionView {
    static get MY_BOOKS_COLLECTION() { return 'myBooks'; }
    static isFolded(userId, collectionId) {
        const folded = localStorage.getItem(`${userId}-${collectionId}-folded`);
        return folded === 'true';
    }
    id;
    expired;
    expiryDate;
    collection;
    folded;
    bookViews;
    constructor(collection, folded) {
        this.id = collection.id;
        this.expired = collection.license.expired ?? false;
        this.expiryDate = collection.license.expiryDate ?? '';
        this.collection = collection;
        this.folded = folded;
        this.bookViews = {};
        for (const book of this.collection.books) {
            if (book?.id) {
                this.bookViews[book.id] = new book_1.default(book, collection);
            }
        }
        this.onCollectionBarClicked = this.onCollectionBarClicked.bind(this);
    }
    isDefaultCollection() {
        return this.id === CollectionView.MY_BOOKS_COLLECTION;
    }
    get domId() {
        return (this.id === CollectionView.MY_BOOKS_COLLECTION)
            ? 'olb-book-collection-myBooks'
            : `olb-book-collection-${this.id}`;
    }
    renderHTML() {
        if (this.isDefaultCollection()) {
            return this.renderMyBooksHTML();
        }
        else {
            return this.renderReadersHTML();
        }
    }
    renderMyBooksHTML() {
        const title = this.getFoldingToggleButtonTitle(this.folded);
        return `<div id="olb-book-collection-myBooks" class="olb-book-collection">
                    <button href="#" class="olb-book-collection-bar ${this.folded ? '' : 'is-active'}" title="${title}">
                        <h1>My books</h1>
                    </button>
                    <div class="olb-book-shelf-bg">
                        <div id="myBooks" class="olb-book-center two-block">
                            ${this.renderAddBook()}
                            ${this.renderBooks()}
                        </div>
                    </div>
                </div>`;
    }
    renderReadersHTML() {
        const title = this.getFoldingToggleButtonTitle(this.folded);
        return `<div id="olb-book-collection-${this.id}" class="olb-book-collection readers ${this.expired ? 'expired' : ''}">
                    <button href="#" class="olb-book-collection-bar ${(this.expired || this.folded) ? '' : 'is-active'}" title="${title}">
                        <h1>${this.collection.title}</h1>
                        ${this.renderExpiryInformation()}
                    </button>
                    <div class="olb-book-shelf-bg">
                        <div id="${this.id}" class="olb-book-center">${this.renderBooks()}</div>
                    </div>
                </div>`;
    }
    renderExpiryInformation() {
        if (this.expiryDate) {
            const expiryStatus = this.expired ? 'Expired: ' : 'Expires: ';
            const expiryDate = new Date(this.expiryDate).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
            return `<p><span>${expiryStatus}</span>${expiryDate}</p>`;
        }
        return '';
    }
    renderBooks() {
        const books = [];
        for (const book of this.collection.books) {
            if (book && this.bookViews[book.id]) {
                books.push(this.bookViews[book.id].renderBook());
            }
        }
        return books.join('');
    }
    renderAddBook() {
        // noinspection HtmlUnknownTarget
        return `<div id="bookshelf-add-book" class="olb-book-wrap default">
                    <div class="olb-diary-book-cover">
                        <p class="olb-book-add-title">Add books</p>
                        <div class="olb-book-container">
                            <button class="olb-book-add-btn" title="Add a book" data-title="add-a-book">
                                <img src="../images/ods/olb-addbk-sm.svg" title="Add a book" alt="Add a book" class="olb-book-cover"/>
                            </button>
                        </div>
                    </div>
                </div>`;
    }
    invalidateBooks(collection) {
        this.collection = collection;
        const parent = document.getElementById(this.domId);
        let previousBook = null;
        for (const book of this.collection.books) {
            if (this.bookViews[book.id] == null) {
                this.bookViews[book.id] = new book_1.default(book, collection);
                this.appendBook(this.bookViews[book.id], previousBook);
                this.bookViews[book.id].bindEvents();
            }
            else {
                this.bookViews[book.id].invalidateBook(book, parent);
                this.bookViews[book.id].setCollection(collection);
            }
            previousBook = book;
        }
    }
    appendBook(bookView, previousBook) {
        const prepend = (previousBook === null);
        const collectionId = this.id;
        if (prepend) {
            if (collectionId === CollectionView.MY_BOOKS_COLLECTION) {
                (0, jquery_1.default)(bookView.renderBook()).insertAfter(`#olb-book-collection-${collectionId} #bookshelf-add-book`);
            }
            else {
                (0, jquery_1.default)(`#olb-book-collection-${collectionId}`).prepend(bookView.renderBook());
            }
        }
        else {
            (0, jquery_1.default)(bookView.renderBook()).insertAfter(`#olb-book-collection-${collectionId} #book-data-${previousBook.id}`);
        }
        bookView.bindEvents();
    }
    attachedTo(parent) {
        parent.append(this.renderHTML());
    }
    filterBooks(filter) {
        const parent = document.getElementById(this.domId);
        for (const bid in this.bookViews) {
            this.bookViews[bid].applyFilter(filter, parent);
        }
        parent.style.display = this.isAllFiltered(filter) ? 'none' : 'block';
    }
    bindEvents() {
        this.bindToggleEvent();
        Object.values(this.bookViews).forEach(book => {
            book.bindEvents();
        });
    }
    bindToggleEvent() {
        const selector = `#olb-book-collection-${this.id} .olb-book-collection-bar`;
        document.querySelector(selector).removeEventListener('click', this.onCollectionBarClicked);
        document.querySelector(selector).addEventListener('click', this.onCollectionBarClicked);
    }
    fold(userId) {
        const bar = document.querySelector(`#olb-book-collection-${this.id} .olb-book-collection-bar`);
        if (bar) {
            bar.classList.remove('is-active');
            bar.setAttribute('title', this.getFoldingToggleButtonTitle(true));
        }
        localStorage.setItem(`${userId}-${this.id}-folded`, true.toString());
        this.folded = true;
    }
    unfold(userId) {
        const bar = document.querySelector(`#olb-book-collection-${this.id} .olb-book-collection-bar`);
        if (bar) {
            bar.classList.add('is-active');
            bar.setAttribute('title', this.getFoldingToggleButtonTitle(false));
        }
        localStorage.removeItem(`${userId}-${this.id}-folded`);
        this.folded = false;
    }
    onCollectionBarClicked(e) {
        e.preventDefault();
        const user = electron_1.ipcRenderer.sendSync('rdp-user');
        if (this.folded) {
            this.unfold(user.id);
        }
        else {
            this.fold(user.id);
        }
        const pulldown = require('../../bookshelf-pulldown');
        pulldown.close();
    }
    isAllFiltered(filter) {
        for (const bid in this.bookViews) {
            if (!this.bookViews[bid].isFiltered(filter)) {
                return false;
            }
        }
        return true;
    }
    getFoldingToggleButtonTitle(folded) {
        return folded ? 'Show these books' : 'Hide these books';
    }
}
exports.default = CollectionView;
module.exports = CollectionView;
