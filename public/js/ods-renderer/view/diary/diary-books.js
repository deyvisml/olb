const { ipcRenderer } = require('electron');
const $ = require('jquery');
const messages = require('../../../ods-share/ods-messages');

const diaryBookView = {

    MIN_BOOK_COUNT: 8,

    dateOption: {
        day:    'numeric',
        month:  'short',
        year:   'numeric'
    },

    render(readBooks, readingBooks) {
        if (readBooks == null || readBooks.length === 0) {
            document.getElementById('read-books').innerHTML = this.renderEmptyBook();
        } else {
            document.getElementById('read-books').innerHTML = this.renderReadBooks(readBooks);
        }

        const html = this.renderReadingBooks(readingBooks);

        if (html) {
            document.getElementById('reading-books').innerHTML = html;
        } else {
            document.getElementById('reading-books').innerHTML = this.renderEmptyBook();
        }
        for (const book of document.querySelectorAll('#reading-books .olb-diary-book-wrap img')) {
            book.addEventListener('click', () => {
                const title = this.getAttribute('data-book-title');

                alert(messages.diary_go_to_bookshelf(title));
            });
        }
    },

    renderEmptyBook() {
        const html = [];

        for (let i = 0; i < this.MIN_BOOK_COUNT; i++) {
            html.push(`<div class="olb-diary-book-wrap olb-diary-book-empty">
                           <img src="../images/ods/olb-read-grey.svg" alt="read a book"/>
                           <p><strong>Enjoy<br />a story<br />today</strong></p>
                       </div>`);
        }
        return html.join('');
    },

    renderReadBooks(readBooks) {
        const html = [];

        for (const book of readBooks) {
            const lastRead = new Date(book.last_read_time * 1000).toLocaleDateString('en-GB', this.dateOption);

            html.push(`<div class="olb-diary-book-wrap">
                           <div class="olb-diary-book-cover olb-diary-book-cover-finished">
                               <p class="olb-diary-book-text-progress">Completed book</p>
                               <img src="${book.list_thumbnail}" alt=""/>
                           </div>
                           <h5>${book.title}</h5>
                           <div class="olb-diary-book-info">
                               <p><strong>CEFR</strong> ${book.cefr_level}</p>
                               <p><strong>Words</strong> ${book.word_count}</p>
                               <p><strong>Time</strong> ${this.getTotalReadingTime(book.total_reading_time)}</p>
                               <p><strong>Last read</strong> ${lastRead}</p>
                           </div>
                       </div>`);
        }
        return html.join('');
    },

    renderReadingBooks(readingBooks) {
        const html = [];

        for (const book of readingBooks) {
            if (book.is_hidden) continue;

            const progress = parseInt(book.read_percentage, 10);

            html.push(`<div class="olb-diary-book-wrap">
                           <div class="olb-diary-progress-bar">
                               <div class="olb-diary-progress-bar-inner" style="width:${ progress }%"></div>
                           </div>
                           <div class="olb-diary-book-cover olb-diary-book-cover-progress" data-book-title="${ book.title }">
                               <p class="olb-diary-book-text-progress">${ progress }% Complete</p>
                               <img src='${ book.list_thumbnail }' alt="" data-book-title="${ book.title }"/>
                           </div>
                           <h5>${ book.title }</h5>
                           <button class="oup-hub-filled-button small olb-book-hide" title="Hide this book from your reading list" data-book-bid="${ book.bid }" data-book-title="${ book.title }">Hide</button>
                       </div>`);
        }
        return html.join('');
    },


    getTotalReadingTime(timestamp) {
        const hour = Math.floor(timestamp / 3600);
        const minutes = Math.floor((timestamp % 3600) / 60);

        return `${this.getPlural(hour, ' hour')} ${this.getPlural(minutes, ' minute')}`;
    },

    getPlural(count, word) {
        if (count === 1) {
            return count + word;
        }
        return `${count + word}s`;
    },


    bindEvent() {
        $('.olb-book-hide').on('click', (e) => {
            if (window.navigator.onLine) {
                if (this.hideBook(e.target)) {
                    const user = ipcRenderer.sendSync('rdp-user');
                    const bid = $(e.target).data('book-bid');

                    ipcRenderer.send('action-diary-hide-book', user.id, bid, 1);
                }
            } else {
                alert(messages.network_connection_required);
            }
        });
    },

    hideBook(element) {
        const title = $(element).data('book-title');

        // eslint-disable-next-line
        if (confirm(messages.diary_request_hide(title))) {
            const hideItem = $(element).parent('.olb-diary-book-wrap');
            const bookList = $('.olb-diary-reading-book .olb-diary-book-wrap');

            for (let i = 0; i < bookList.length; i++) {
                if ($(bookList[i]).css('display') === 'none') {
                    bookList.splice(i, 1);
                }
            }
            $(hideItem).hide();

            if (bookList.length <= 1) {
                $('#reading-books').append(this.renderEmptyBook());
            }
            return true;
        } else {
            return false;
        }
    },

};

module.exports = diaryBookView;