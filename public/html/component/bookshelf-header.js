class BookshelfHeader extends HTMLElement {
    constructor() {
        super();

        this.innerHTML = `
<div class="container">
    <div class="navbar-header">
        <a class="navbar-brand oup-branding" href="#" title="Oxford University Press"></a>

        <div id="header-profile" class="navbar-profile"></div>
    </div>
</div>`;
    }
}

customElements.define('bookshelf-header', BookshelfHeader);