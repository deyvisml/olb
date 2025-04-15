class ReadingDiaryStatusBox extends HTMLElement {
    constructor() {
        super();

        this.innerHTML = `
<div class="status-box">
    <div id="diary-sync-required" class="sync-box">
        <a href="javascript:">
            <img class="sync-badge" src="../images/ods/diary_sync_failed.png"/>
        </a>
    </div>
</div>`;
    }
}

customElements.define('reading-diary-status-box', ReadingDiaryStatusBox);