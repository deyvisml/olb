class FooterGuideLinks extends HTMLElement {

    constructor() {
        super();

        this.innerHTML = `
<div class="footer-container guide-links">
    <div class="container footer-content-container">
        <div class="row footer-body">
            <div class="col-md-2 footer-collapse">
                <h4>Talk to us</h4>
                <ul>
                    <li><a onClick="help('contact_us_2.htm');">Contact us</a></li>
                </ul>
            </div>
            <div class="col-md-2 footer-collapse">
                <h4>More from us</h4>
                <ul>
                    <li><a onClick="openBrowser('https://elt.oup.com');">English Language Teaching</a></li>
                    <li><a onClick="openBrowser('https://elt.oup.com/teachersclub');">Oxford Teachers' Club</a></li>
                    <li><a onClick="openBrowser('https://www.oxfordlearnersbookshelf.com');">Oxford Learner's Bookshelf</a></li>
                    <li><a onClick="openBrowser('https://www.oxfordlearnersdictionaries.com');">Oxford Learner's Dictionaries</a></li>
                </ul>
            </div>
            <div class="col-md-2 footer-collapse">
                <h4>Who we are</h4>
                <ul>
                    <li><a onClick="openBrowser('https://global.oup.com/about');">About us</a></li>
                    <li><a onClick="openBrowser('https://global.oup.com/about/oup_history');">Our history</a></li>
                    <li><a onClick="openBrowser('https://global.oup.com/about/annualreport');">Annual report</a></li>
                    <li><a onClick="openBrowser('https://global.oup.com/about/way_we_work');">The way we work</a></li>
                    <li><a onClick="openBrowser('https://global.oup.com/jobs');">Working for OUP</a></li>
                </ul>
            </div>
            <div class="col-md-2">
            </div>
            <div class="col-md-4">
                <div class="logo-container">
                    <div class="footer-collapse">
                        <p>Oxford University Press is a department of the University of Oxford. It furthers the University's
                            objective of excellence in research, scholarship, and education by publishing worldwide</p>
                    </div>
                    <img class="logo-footer" src="../images/logos/oup-logo-navy.svg">
                </div>
            </div>
        </div>
    </div>
</div>`;
    }

}

customElements.define('footer-guide-links', FooterGuideLinks);