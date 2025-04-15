const $ = require('jquery');

const diaryDashboard = {

    WORDS_READ_DIGITS: 6,

    render(diary) {
        this.setTitle(diary.read_books_count);
        this.setWordRead(diary.read_words_count);
        this.setTimeSpent(diary.time_spent_reading);
    },

    setTitle(count) {
        const diaryTitle = `${this.getPlural(count, ' book')} read`;

        $('#diary-title').text(diaryTitle);
    },

    setTimeSpent(reading) {
        $('#spentHour').text(this.getPlural(reading.hours, ' hour'));
        $('#spentMinute').text(this.getPlural(reading.minutes, ' minute'));
    },

    setWordRead(wordCount) {
        $('#numberOfWord').empty();

        const digits = wordCount.toString().split('');

        if (digits.length < 6) {
            for (let i = digits.length; i < 6; i++) {
                $('#numberOfWord').append('<div class="olb-diary-each-number"><p>0</p></div>');
            }
        }

        for (const digit of digits) {
            $('#numberOfWord').append(`<div class="olb-diary-each-number"><p>${digit}</p></div>`);
        }
    },

    getPlural(count, word) {
        let result = `${count}${word}`;

        if (count !== 1) {
            result += 's';
        }
        return result;
    },

};

module.exports = diaryDashboard;