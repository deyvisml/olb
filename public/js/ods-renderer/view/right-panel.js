const $ = require('jquery');

const openPanel = (panelName, params = null) => {
    $('.right-panel-wrapper').load(`./modal/${panelName}.html`, () => {
        // Pass parameter to the next-panel.
        if (params) {
            for (const key in params) {
                if (Object.prototype.hasOwnProperty.call(params, key)) {
                    $(`#${key}`).val(params[key]);
                }
            }
        }
    });

    setTimeout(() => {
        $('.right-panel').addClass('is-visible');
        $('html').addClass('disable-scroll');
    }, 120);
};

const changePanel = (panelName) => {
    $('.right-panel-wrapper').load(`./modal/${panelName}.html`);
};

const closePanel = (e) => {
    e.preventDefault();

    $('.right-panel').removeClass('is-visible');

    setTimeout(() => {
        $('.right-panel-wrapper').empty(); // Removes HTML Content
        $('html').removeClass('disable-scroll');
    }, 1000);
};

// const countCheckedPanel = function () {
//     const e = $('.right-panel-container').find('.table-col-checkbox').find('input:checked').length;
//     e === 0 ? $('.actions-right-panel').addClass('actions-panel-hidden') : $('.actions-right-panel').removeClass('actions-panel-hidden'), $('.actions-counter-right-panel').find('span').text(e);
// };
//
// countCheckedPanel(), $('.table-col-checkbox').find('input[type=checkbox]').on('click', countCheckedPanel).change(function () {
//     $(this).is(':checked') ? $(this).closest('tr').addClass('table-row-selected') : $(this).closest('tr').removeClass('table-row-selected');
// }), $('#panelTwo').hide(), $('.toggle-switch').find('input[type=checkbox]').click(() => {
//     $('#panelOne, #panelTwo').toggle();
// }), $('.btn-toggle-icon-down, .btn-toggle-icon-up, .btn-accordion').click(function () {
//     $(this).toggleClass('down');
// });

$('.change-content').click((e) => {
    e.preventDefault();

    const name = $(this).data('launchsidepanel');

    changePanel(name);
});

$(document).keydown((e) => {
    if (e.keyCode === 27) {
        closePanel(e);
    }
});

$('html').on('click', '.right-panel', (e) => {
    if ($(e.target).is('.right-panel') || $(e.target).is('.right-panel-close')) {
        closePanel(e);
    }
});

module.exports = {
    openPanel: openPanel,
    closePanel: closePanel,
    changePanel: changePanel,
};