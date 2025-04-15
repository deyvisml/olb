"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jquery_1 = __importDefault(require("jquery"));
const electron_1 = require("electron");
const data_beautifier_1 = __importDefault(require("./utils/data-beautifier"));
const ods_messages_1 = __importDefault(require("../ods-share/ods-messages"));
const popup_1 = __importDefault(require("./view/profile-widget/popup"));
const bookshelf_1 = __importDefault(require("./bookshelf"));
const inviteBanner = {
    dateOption: {
        day: 'numeric',
        month: 'long',
        year: '2-digit'
    },
    init() {
        this.bindEvents();
        this.load();
    },
    load() {
        electron_1.ipcRenderer.send('action-invitations-request');
    },
    invalidate() {
        (0, jquery_1.default)('#invitation-panel-denied').slideUp();
        (0, jquery_1.default)('#invitation-panel-accept').slideUp();
        inviteBanner.load();
    },
    bindEvents() {
        electron_1.ipcRenderer.on('action-invitations-response', (_, invitations) => {
            if (invitations?.length > 0) {
                invitations = this.filterInvalidInvitations(invitations);
                this.renderBanner(invitations);
            }
        });
        electron_1.ipcRenderer.on('action-update-invitation-response', this.onInvitationUpdated);
        document.getElementById('invitation-request-denied').addEventListener('click', this.invalidate);
        document.getElementById('invitation-accept-confirm').addEventListener('click', this.invalidate);
    },
    filterInvalidInvitations(invitations) {
        const validInvitations = [];
        for (const invitation of invitations) {
            const remainingDays = this.getRemainingDays(invitation.expiryDate);
            // Remarks: Invitation is shown to the user within 31 days after expiration.
            if (invitation.expiryDate && remainingDays <= -31)
                continue;
            validInvitations.push(invitation);
        }
        return validInvitations;
    },
    getPendingCount(invitations) {
        return invitations.filter(invitation => invitation?.expired == false).length;
    },
    getRemainingDays(expiryDate) {
        const expiry = new Date(expiryDate);
        const today = new Date();
        const remaining = expiry.getTime() - today.getTime();
        return Math.ceil(remaining / (1000 * 60 * 60 * 24));
    },
    renderBannerHeader(count) {
        switch (count) {
            case 0:
                return '<p>You have <span class="strong">no invitations </span> pending</p>';
            case 1:
                return `<p>You have <span class="strong">${count} invitation </span> pending</p>`;
            default:
                return `<p>You have <span class="strong">${count} invitations </span> pending</p>`;
        }
    },
    renderBannerNavigation(plural) {
        if (plural) {
            // noinspection HtmlUnknownAnchorTarget
            return `<div class="carousel-navigation">
                      <a href="#invitation-carousel" data-slide="prev" class="link-back link-carousel link-previous">Previous</a>
                      <a href="#invitation-carousel" data-slide="next" class="link link-carousel link-next">Next</a>
                    </div>`;
        }
        else {
            return '';
        }
    },
    renderInvitationBody(invitation) {
        const roleName = data_beautifier_1.default.getDisplayRolename(invitation.roleName);
        return `<p>You have been invited to join <span class="strong">${invitation.group.name}</span> as a <span class="strong">${roleName}</span></p>
                <h5 class="sub-color">Invitation sent on ${new Date(invitation.date).toLocaleDateString('en-GB', this.dateOption)}</h5>`;
    },
    renderExpiryMessages(invitation) {
        const remainingDays = this.getRemainingDays(invitation.expiryDate);
        if (remainingDays > 0 && remainingDays <= 15) {
            return `<h5 class="str-warning">This invitation will expire in ${remainingDays} days</h5>`;
        }
        else if (remainingDays <= 0) {
            return '<h5 class="str-error">This invitation has expired</h5>';
        }
        else {
            return '';
        }
    },
    renderInvitationAction(invitation) {
        const dataSets = `data-org-id="${invitation.group.id}" data-org-name="${invitation.group.name}" data-role-name="${invitation.roleName}"`;
        if (invitation.expired) {
            return `<button type="button" class="btn btn-primary dismiss" ${dataSets}>Dismiss</button>`;
        }
        else {
            return `<button type="button" class="btn btn-primary accept" ${dataSets}>Accept</button>
                    <button type="button" class="btn btn-tertiary decline" ${dataSets}>Decline</button>`;
        }
    },
    renderBannerContents(invitations) {
        let content = '';
        for (const invitation of invitations) {
            const index = invitations.indexOf(invitation);
            content += `<div class="item ${(index === 0) ? 'active' : ''}">
                            <div class="ces-banner-icon ces-ellipse-medium ces-organization-flat">
                                <div class="ces-ellipse-image icon-organization"></div>
                            </div>
                            <div class="ces-banner-text">
                                ${this.renderInvitationBody(invitation)}                            
                                ${this.renderExpiryMessages(invitation)}
                            </div>
                            <div class="ces-banner-buttons">
                                ${this.renderInvitationAction(invitation)}
                            </div>
                        </div>`;
        }
        return content;
    },
    renderBanner(invitations) {
        const plural = invitations.length > 1;
        let content = '';
        if (invitations && invitations.length > 0) {
            content = `<div class="container">
                         <div class="row ces-banner-container">
                           <div class="col-sm-12 ces-banner">
                             <div class="ces-banner-header">
                                ${this.renderBannerHeader(this.getPendingCount(invitations))}
                             </div>
                             <div class="ces-banner-content">
                                ${this.renderBannerNavigation(plural)}
                                <div id="invitation-carousel" class="carousel slide" data-interval="false">
                                  <div class="carousel-inner">
                                    ${this.renderBannerContents(invitations)}
                                  </div>
                                </div>
                             </div>
                           </div>
                         </div>
                       </div>`;
        }
        (0, jquery_1.default)('#invitation-panel').empty().append(content).toggleClass('open');
        (0, jquery_1.default)('#invitation-panel').slideDown();
        (0, jquery_1.default)('.ces-banner-buttons .accept').bind('click', this.accept);
        (0, jquery_1.default)('.ces-banner-buttons .decline').bind('click', this.confirmDecline);
        (0, jquery_1.default)('.ces-banner-buttons .dismiss').bind('click', this.dismiss);
    },
    getParams(e, status) {
        return {
            orgId: e.target.getAttribute('data-org-id'),
            orgName: e.target.getAttribute('data-org-name'),
            roleName: e.target.getAttribute('data-role-name'),
            status: status
        };
    },
    accept(e) {
        if (navigator.onLine) {
            (0, jquery_1.default)('#invitation-panel-decline').slideUp();
            (0, jquery_1.default)('#invitation-panel').slideUp();
            (0, jquery_1.default)('#loading-background').show();
            electron_1.ipcRenderer.send('action-update-invitation-request', inviteBanner.getParams(e, 'ACCEPTED'));
        }
        else {
            alert(ods_messages_1.default.network_connection_required);
        }
    },
    dismiss(e) {
        if (navigator.onLine) {
            electron_1.ipcRenderer.send('action-update-invitation-request', inviteBanner.getParams(e, 'DISMISS'));
        }
        else {
            alert(ods_messages_1.default.network_connection_required);
        }
    },
    decline(e) {
        if (navigator.onLine) {
            (0, jquery_1.default)('#invitation-panel-decline').slideUp();
            electron_1.ipcRenderer.send('action-update-invitation-request', inviteBanner.getParams(e, 'REJECTED'));
        }
        else {
            alert(ods_messages_1.default.network_connection_required);
        }
    },
    confirmDecline(e) {
        (0, jquery_1.default)('#invitation-panel').slideUp();
        (0, jquery_1.default)('#invitation-panel-decline').slideDown();
        (0, jquery_1.default)('#invitation-panel-decline #decline-invitation').unbind();
        (0, jquery_1.default)('#invitation-panel-decline #decline-cancel').unbind();
        (0, jquery_1.default)('#invitation-panel-decline #decline-invitation').bind('click', () => {
            inviteBanner.decline(e);
        });
        (0, jquery_1.default)('#invitation-panel-decline #decline-cancel').bind('click', () => {
            inviteBanner.cancelDecline();
        });
    },
    cancelDecline() {
        (0, jquery_1.default)('#invitation-panel-decline').slideUp();
        (0, jquery_1.default)('#invitation-panel').slideDown();
    },
    onInvitationUpdated(e, result) {
        (0, jquery_1.default)('#loading-background').hide();
        if (result.status === 'success') {
            if (result.type === 'ACCEPTED') {
                inviteBanner.onInvitationAccepted(result);
            }
            else {
                inviteBanner.load();
            }
        }
        else {
            (0, jquery_1.default)('#invitation-panel-denied').slideDown();
        }
    },
    onInvitationAccepted(result) {
        const baseURL = electron_1.ipcRenderer.sendSync('rdp-environment', 'OUP_HUB_BASE_URL');
        const user = electron_1.ipcRenderer.sendSync('rdp-user');
        const collections = electron_1.ipcRenderer.sendSync('rdp-collections');
        const roleName = data_beautifier_1.default.getDisplayRolename(result.roleName);
        const link = `<a onclick="openBrowser('${baseURL}/hub');">${result.orgName} &nbsp;<div class="link-img"></div></a>`;
        const msg = `Hi ${user.firstName}, you have successfully joined ${link} as <span class="strong">a ${roleName}</span>`;
        popup_1.default.render();
        bookshelf_1.default.invalidate(collections);
        (0, jquery_1.default)('#invitation-panel-accept .ces-banner-text p').html(msg);
        (0, jquery_1.default)('#invitation-panel-accept').slideDown();
    },
};
inviteBanner.init();
