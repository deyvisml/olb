const $ = require('jquery');

const medalView = {

    MIN_MEDALS:     24,
    MEDAL_IN_ROW:   6,

    render(diary) {
        $('#diary-medal').empty();

        const medalCount = this.getMedalCount(diary.read_books_count);
        const html = [];

        for (let i = 0; i < medalCount; i++) {
            if (this.isStartRow(i)) {
                html.push('<div class="olb-diary-splash-1-row">');
            }
            if (i < diary.read_books_count) {
                html.push('<img src="../images/ods/olb-medal.svg" class="olb-diary-splash-complete" alt=""/>');
            } else {
                html.push('<img src="../images/ods/olb-medal.svg" alt=""/>');
            }
            if (this.isEndRow(i)) {
                html.push('</div>');
            }
        }
        $('#diary-medal').append(html.join(''));
    },

    getMedalCount(readCount) {
        if (readCount < this.MIN_MEDALS) {
            return this.MIN_MEDALS;
        } else {
            return readCount + (this.MEDAL_IN_ROW - (readCount % this.MEDAL_IN_ROW));
        }
    },

    isStartRow(idx) {
        return (idx % this.MEDAL_IN_ROW === 0);
    },

    isEndRow(idx) {
        return (idx % this.MEDAL_IN_ROW === (this.MEDAL_IN_ROW - 1));
    },

};

module.exports = medalView;