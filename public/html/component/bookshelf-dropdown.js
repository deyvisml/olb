class BookshelfDropdown extends HTMLElement {
    constructor() {
        super();

        this.innerHTML = `
<div id='dropdown-align-box'></div>
<div id='dropdown-detail-box' class="book-detail-menu">
    <div class="wrap">

        <div id="dropdown-left-column" class="left-column">
            <div class="cpt-wrap">
                <div class='cpt-logo'></div>
                <div class='cpt-desc'>Classroom Presentation Tool</div>
                <div class="clear"></div>
            </div>

            <div class="title"></div>
            <div class="cefr-level"></div>
            <div class="author"></div>
            <div class="links"></div>
            <div class="words-count"></div>
            <div class="expired-date"></div>
        </div>

        <div id="dropdown-right-column" class="right-column">
            <div class="description"></div>
            <button id='olb-book-download-button' class="olb-dropdown-button dropdown-download-book">
                <div class="cloud-download"></div>
                <div class="radial-progress" data-progress="0">
                    <div class="circle">
                        <div class="mask full">
                            <div class="fill"></div>
                        </div>
                        <div class="mask half">
                            <div class="fill"></div>
                            <div class="fill fix"></div>
                        </div>
                        <div class="shadow"></div>
                    </div>
                </div>
                <span>Download</span>
            </button>
            <button id='olb-book-open-button' class='olb-dropdown-button dropdown-open-book'>
                <span>Open</span>
            </button>
            <button id='olb-book-cancel-button' class='olb-dropdown-button dropdown-cancel-download'>
                <span>Cancel</span>
            </button>
            <button id='olb-book-delete-button' class='olb-dropdown-button dropdown-delete-book'>
                <div class='trash'></div>
                <span>Delete</span>
            </button>
            <button id='olb-book-add-button' class='olb-dropdown-button dropdown-redeem-code'>
                <span>Enter Access Code</span>
            </button>
            <button id='olb-book-buy-button' class='olb-dropdown-button dropdown-buy-book'>
                <span>Buy online</span>
            </button>
            <div class="book-info-wrap">
                <div class='file-size' style="display:none;">File size: 2.3GB</div>
                <div class='updated'></div>
            </div>
        </div>
    </div>
    <button id="bookshelf-close-pulldown" class="book-detail-menu-close lighter-green">
        <img alt="Close" src="../images/ods/mdl-close.svg">
    </button>
</div>`;
    }
}

customElements.define('bookshelf-dropdown', BookshelfDropdown);