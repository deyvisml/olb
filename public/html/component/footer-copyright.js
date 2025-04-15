class FooterCopyright extends HTMLElement {
    constructor() {
        super();

        this.innerHTML = `
<footer class="footer side-collapse-container">
    <div class="footer-container" style="padding: 10px 0">
        <div class="olb-footer">
            <img class="logo-footer left" src="../images/icons/footer/spindle-logo-footer.svg" alt="spindle logo">
            <img class="logo-footer right" src="../images/logos/oup-logo-navy.svg" alt="oup logo">
        </div>
    </div>
</footer>
`;
        this.addStyleSheet();
    }

    addStyleSheet() {
        const head  = document.getElementsByTagName('head')[0];
        const styleSheet  = document.createElement('link');

        styleSheet.rel  = 'stylesheet';
        styleSheet.type = 'text/css';
        styleSheet.href = 'component/footer-copyright.css';

        head.appendChild(styleSheet);
    }
}

customElements.define('footer-copyright', FooterCopyright);