const SKY_VIEW_IMAGE_RATIO = 0.5116;

const { ipcRenderer } = require('electron');
const ga = require('./utils/google-analytics');
const dashboard = require('./view/diary/dashboard');
const medalView = require('./view/diary/medal');
const galaxyView = require('./view/diary/galaxy');
const bookView = require('./view/diary/diary-books');

let currentDiaryView = 'medal'; // medal or star

function switchDiaryView() {
    currentDiaryView = currentDiaryView === 'medal' ? 'star' : 'medal';

    if (currentDiaryView === 'medal') {
        document.querySelectorAll('.olb-diary-arrow').forEach((arrow) => {
            arrow.title = 'Move to star-view';
        });
        ga.sendEvent(ga.CATEGORY.READING_DIARY, ga.ACTION.SCENE, 'Medal');
    } else if (currentDiaryView === 'star') {
        document.querySelectorAll('.olb-diary-arrow').forEach((arrow) => {
            arrow.title = 'Move to medal-view';
        });
        ga.sendEvent(ga.CATEGORY.READING_DIARY, ga.ACTION.SCENE, 'Star');
    }
}

function resizeSliderHeight() {
    const width = document.getElementById('olb-diary-splash-container').offsetWidth;
    const height = width * SKY_VIEW_IMAGE_RATIO;

    document.getElementById('olb-diary-splash-container').style.height = `${height}px`;
}

window.addEventListener('load', resizeSliderHeight);

window.addEventListener('resize', resizeSliderHeight);

document.getElementById('loading-background').style.display = 'block';

setTimeout(() => {
    const diary = ipcRenderer.sendSync('rdp-reading-dairy');

    dashboard.render(diary);

    medalView.render(diary);
    galaxyView.render(diary);

    bookView.render(diary.read_books, diary.reading_books);
    bookView.bindEvent();

    document.querySelectorAll('.olb-diary-arrow').forEach(element =>
        element.addEventListener('click', switchDiaryView)
    );

    ga.sendEvent(ga.CATEGORY.READING_DIARY, ga.ACTION.SCENE, 'Medal');

    document.getElementById('loading-background').style.display = 'none';
}, 16);