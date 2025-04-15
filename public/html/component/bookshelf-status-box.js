class BookshelfStatusBox extends HTMLElement {
    constructor() {
        super();

        this.innerHTML = `
<div class="status-box">
    <div id="ads-sync-required" class="sync-box">
        <a href="javascript:">
            <img class="sync-badge" src="../images/ods/badge_sync_failed.png"/>
        </a>
    </div>

    <div id="update-game-required" class="sync-box">
        <a href="javascript:">
            <img class="sync-badge" src="../images/ods/badge_game.png"/>
        </a>
    </div>

    <div id="update-game-inprogress" class="sync-box">
        <a href="javascript:">
            <div class="game-update-spinner"></div>
            <img class="sync-badge" src="../images/ods/badge_game_updating.png"/>
        </a>
    </div>
</div>`;
    }
}

customElements.define('bookshelf-status-box', BookshelfStatusBox);