"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
function updateDropdownElement(filterName, filterValue) {
    const element = document.querySelector(`.bookshelf-filter-option[data-name="${filterName}"`);
    if (element) {
        element.setAttribute('data-show', filterValue.toString());
    }
}
function getFilterOption() {
    return {
        active: document.querySelector('.bookshelf-filter-option[data-name="active"]').getAttribute('data-show') !== 'true',
        expired: document.querySelector('.bookshelf-filter-option[data-name="expired"]').getAttribute('data-show') !== 'true',
        unlicensed: document.querySelector('.bookshelf-filter-option[data-name="unlicensed"]').getAttribute('data-show') !== 'true',
        sample: document.querySelector('.bookshelf-filter-option[data-name="sample"]').getAttribute('data-show') !== 'true'
    };
}
function saveFilterCondition() {
    electron_1.ipcRenderer.send('action-bookshelf-filter-changed', getFilterOption());
}
function resetFilterOptions() {
    const bookshelf = require('./bookshelf');
    updateDropdownElement('active', true);
    updateDropdownElement('expired', true);
    updateDropdownElement('unlicensed', true);
    updateDropdownElement('sample', true);
    electron_1.ipcRenderer.send('action-bookshelf-filter-changed', {
        active: false,
        expired: false,
        unlicensed: false,
        sample: false,
    });
    bookshelf.onFilterReset();
}
function onFilterConditionChanged(filterName, filterValue) {
    updateDropdownElement(filterName, filterValue);
    saveFilterCondition();
}
function filterBooks(collectionViews) {
    const filter = getFilterOption();
    for (const cid in collectionViews) {
        collectionViews[cid].filterBooks(filter);
    }
    updateEmptyFilterResult(filter, collectionViews);
}
function isAllFiltered(filter, collectionViews) {
    for (const collectionId in collectionViews) {
        if (!collectionViews[collectionId].isAllFiltered(filter)) {
            return false;
        }
    }
    return true;
}
function updateEmptyFilterResult(filter, collectionViews) {
    removeEmptyFilterResult();
    if (isAllFiltered(filter, collectionViews)) {
        showEmptyFilterResult();
    }
}
function showEmptyFilterResult() {
    const dom = new DOMParser().parseFromString(`<div class="no-item no-filtered-item">
                    <img src="../images/icons/validation/icon-validation-information.svg" alt/>
                    <h1>No results found</h1>
                    <p>No items are selected in the filter.<br>Please reset using the link and try a different search.</p>
                    <button id='reset-filter' class="long btn btn-primary">
                        Reset filters
                    </button>
                </div>`, 'text/html'); // eslint-disable-line
    document.querySelector('.olb-book-main-wrap').appendChild(dom.body.firstChild);
    document.getElementById('reset-filter').addEventListener('click', () => {
        resetFilterOptions();
    });
}
function removeEmptyFilterResult() {
    if (document.querySelector('.no-item') && document.querySelector('.no-item').parentNode) {
        document.querySelector('.no-item').parentNode
            .removeChild(document.querySelector('.no-item'));
    }
}
(() => {
    const filter = electron_1.ipcRenderer.sendSync('rdp-user-preference', 'bookshelf-book-filter', {
        active: false,
        expired: false,
        unlicensed: false,
        sample: false
    }, true);
    for (const option of document.querySelectorAll('.bookshelf-filter-option')) {
        option.setAttribute('data-show', (!filter[option.getAttribute('data-name')]).toString());
    }
})();
const exportObject = {
    getFilter: getFilterOption,
    filterBooks: filterBooks,
    onFilterChanged: onFilterConditionChanged,
};
exports.default = exportObject;
module.exports = exportObject;
