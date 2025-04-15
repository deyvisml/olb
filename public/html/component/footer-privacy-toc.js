class FooterPrivacyToc extends HTMLElement {
    constructor() {
        super();

        const date = new Date();
        const year = date.getFullYear();
        const copyRight = `© ${year} Oxford University Press`;

        this.innerHTML = `
<div class="footer-container privacy-toc">
    <div class="container footer-corporate-container">
        <div class="row footer-body">
            <div class="col-md-12">
                <ul>
                    <li><a onClick="openBrowser('https://global.oup.com/privacy');">Privacy Policy</a></li>
                    <li><a onClick="openBrowser('https://global.oup.com/cookiepolicy');">Cookie Policy</a></li>
                    <li><a onClick="openBrowser('https://elt.oup.com/olb_terms_and_conditions#terms_and_conditions');">Terms and Conditions</a></li>
                    <li><a onClick="openBrowser('https://elt.oup.com/accessibility');">Accessibility</a></li>
                    <li><a onClick="openBrowser('https://elt.oup.com/olb_terms_and_conditions?cc=kr&selLanguage=ko');">Legal Notice</a></li>
                    <li id="footer-copyright">${copyRight}</li>
                </ul>
            </div>
        </div>
    </div>
</div>`;
    }
}

customElements.define('footer-privacy-toc', FooterPrivacyToc);