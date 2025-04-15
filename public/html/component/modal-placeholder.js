class ModalPlaceholder extends HTMLElement {
    constructor() {
        super();

        this.innerHTML = `
<div id="modal-window" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="mdl-title"
     aria-describedby="mdl-title">
    <div class="modal-dialog">
        <div class="modal-content"></div>
    </div>
</div>

<div class="right-panel from-right">
    <div class="right-panel-wrapper"></div>
</div>`;
    }
}

customElements.define('modal-placeholder', ModalPlaceholder);