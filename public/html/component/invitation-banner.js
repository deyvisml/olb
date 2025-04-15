class InvitationBanner extends HTMLElement {
    constructor() {
        super();

        this.innerHTML = `
<div class="ces-panel-header" id="invitation-panel-denied" style="display: none;">
    <div class="container">
        <div class="row ces-banner-container">
            <div class="col-sm-12 ces-banner">
                <div class="ces-banner-content">
                    <div class="carousel slide" data-interval="false">
                        <div class="carousel-inner">
                            <div class="item active">
                                <div class="ces-banner-icon ces-ellipse-medium ces-background">
                                    <div class="ces-ellipse-image icon-validation-expired"></div>
                                </div>
                                <div class="ces-banner-text">
                                    <p>There was an error. You have already [accepted/declined] this invitation</p>
                                    <h5 class="sub-color">You can view your organization information in your account area</h5>
                                </div>
                                <div class="ces-banner-buttons">
                                    <button id="invitation-request-denied" type="button" class="btn btn-primary">OK</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="ces-panel-header" id="invitation-panel-accept" style="display: none;">
    <div class="container">
        <div class="row ces-banner-container">
            <div class="col-sm-12 ces-banner">
                <div class="ces-banner-content">
                    <div class="carousel slide" data-interval="false">
                        <div class="carousel-inner">
                            <div class="item active">
                                <div class="ces-banner-icon ces-ellipse-medium ces-background">
                                    <div class="ces-ellipse-image icon-validation-active"></div>
                                </div>
                                <div class="ces-banner-text">
                                    <p></p>
                                    <h5 class="sub-color">Any books that you have been assigned will be added to your bookshelf</h5>
                                </div>
                                <div class="ces-banner-buttons">
                                    <button id="invitation-accept-confirm" type="button" class="btn btn-primary">OK</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="ces-panel-header" id="invitation-panel-decline" style="display: none;">
    <div class="container">
        <div class="row ces-banner-container">
            <div class="col-sm-12 ces-banner">
                <div class="ces-banner-content">
                    <div class="carousel slide" data-interval="false">
                        <!-- Wrapper for slides -->
                        <div class="carousel-inner">
                            <div class="item active">
                                <div class="ces-banner-icon ces-ellipse-medium ces-background">
                                    <div class="ces-ellipse-image icon-validation-expired"></div>
                                </div>
                                <div class="ces-banner-text">
                                    <p>Are you sure you want to decline this invitation?</p>
                                </div>
                                <div class="ces-banner-buttons">
                                    <button id="decline-invitation" type="button" class="btn btn-decline">Decline</button>
                                    <button id="decline-cancel" type="button" class="btn btn-back">Back</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="ces-panel-header" id="invitation-panel" style="display: none;">
</div>`;
    }
}

customElements.define('invitation-banner', InvitationBanner);