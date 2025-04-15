const { ipcRenderer } = require('electron');

function renderActionButtons(content) {
    let html = '';

    if (Object.prototype.hasOwnProperty.call(content, 'learn_more_content_final_page_button1_text')
        && content.learn_more_content_final_page_button1_text !== '') {

        html += `<p>
                     <button type="button" onclick="openBrowser('${content.learn_more_content_final_page_button1_path}');" class="btn btn-primary">${content.learn_more_content_final_page_button1_text}</button>
                 </p>`;
    }
    if (Object.prototype.hasOwnProperty.call(content, 'learn_more_content_final_page_button2_text')
        && content.learn_more_content_final_page_button2_text !== '') {

        html += `<p>
                     <button type="button" onclick="openBrowser('${content.learn_more_content_final_page_button2_path}');" class="btn btn-primary">${content.learn_more_content_final_page_button2_text}</button>
                 </p>`;
    }
    return html;
}

function renderHTML() {
    const content = ipcRenderer.sendSync('rdp-ces-learn-more');
    let html = '';

    if (content.page_image_source_1 != null) {
        let idx = 1;

        while (Object.prototype.hasOwnProperty.call(content, `page_image_source_${idx}`) && content[(`page_image_source_${idx}`)] !== '') {
            const imgSrc = content[(`page_image_source_${idx}`)];
            const imgAlt = content[(`page_image_alt_text_${idx}`)];
            const header = content[(`page_header_${idx}`)];
            const body = content[(`page_body_${idx}`)];
            const active = (idx === 1) ? 'active' : '';

            html += `<div class="item ${active}">
                        <div class="learnmore-image">
                            <img src="${imgSrc}" alt="${imgAlt}"/>
                            <div class="carousel-caption">
                                <h1>${header}</h1>
                            </div>
                        </div>
                        <div class="onboarding-content">
                            <p>${body}</p>
                        </div>
                    </div>`;
            idx++;
        }
    }

    if (Object.prototype.hasOwnProperty.call(content, 'learn_more_content_final_page_title')) {
        html += `<div class="item">
                     <div class="onboarding-links" style="margin-top: 35px;">
                         <h1>${content.learn_more_content_final_page_title}</h1>
                         <p class="lead">${content.learn_more_content_final_page_subtitle}</p>
                         ${renderActionButtons(content)}
                     </div>
                 </div>`;
    }
    return html;
}

module.exports = {
    renderHTML
};