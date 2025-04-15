const $ = require('jquery');
const { ipcRenderer } = require('electron');
const beautifier = require('../../utils/data-beautifier');
const rightPanel = require('../right-panel');
const ga = require('../../utils/google-analytics');
const EnvConfig = require('../../../config/env-config');
const DeviceUtils = require('../../../utils/device-utils');

const profileWidget = {

    render() {
        const user = ipcRenderer.sendSync('rdp-user');
        const acronym = beautifier.getAcronym(user.firstName, user.lastName);
        const fullname = beautifier.getFullname(user.firstName, user.lastName);
        const username = beautifier.getNormalizedUsername(user.userName);
        const welcomeToHubUrl = `${EnvConfig.get(EnvConfig.CESConfig.OUP_HUB_BASE_URL)}/elt/hub`;

        document.getElementById('header-profile').innerHTML = // eslint-disable-line
            `<ul class="nav navbar-nav navbar-right">
                <li class="help-support-box">
                    <button class="oup-hub-transparent-button medium icon help" title="Help and Support" tabindex="0" onClick="help();">Help and Support</button>
                </li>
                <li class="dropdown profile-dropdown">
                    <button id="profile-widget-open" 
                       href="#"
                       class="dropdown-toggle oup-hub-account-button medium"
                       style="margin-top: 7px"
                       tabindex="0"
                       data-toggle="dropdown"
                       aria-haspopup="true" 
                       aria-expanded="false">
                        <div title="My account" class="acronym-box">
                            <span id="profile-wdg-header-acronym" class="acronym">${ acronym }</span>
                        </div>
                    </button>
                    <ul id="profile-widget-dropdown" class="dropdown-menu">
                        <h3 class="dropdown-header">My account</h3>
                        <li class="profile-box">
                            <div>
                                <div class="oup-hub-account-button medium" style="position: relative; float: left;" aria-expanded="false">
                                    <div title="My account" class="acronym-box">
                                        <span id="profile-wdg-header-acronym" class="acronym">${ acronym }</span>
                                    </div>
                                </div>
                                <div class="ces-list-group profile-name-box">
                                    <span id="profile-wdg-fullname" class="user-name">${ fullname }</span>
                                    <h5 id="profile-wdg-username" class="user">${ username }</h5>
                                </div>
                                <button id="edit-profile" 
                                    type="button" 
                                    class="oup-hub-outline-button round small" 
                                    style="display: block; margin: 12px 0 12px 50px;">Edit my account</button>
                                    
                                <div></div>
                            </div>
                        </li>

                        <li id="oup-hub-banner" class="oup-hub-banner">
                            <div class="oup-hub-banner-body">
                                <img src="../images/profile-widget/findout-more.png" />
                                <h2>Oxford English Hub</h2>
                                <p>See progress, classes, and other learning material on Oxford English Hub.</p>

                                <button class="oup-hub-link-button" onClick="openBrowser('${ welcomeToHubUrl }');">
                                    Go to Oxford English Hub<div class="link-img"></div>
                                </button>
                            </div>
                        </li>
                        
                        <li>
                            <button id="signout" class="oup-hub-transparent-button medium" href="#" onClick="signout();">Sign out</a>
                        </li>
                    </ul>
                </li>
             </ul>`;

        this.bindEvents();
    },

    invalidate() {
        const user = ipcRenderer.sendSync('rdp-user');
        const acronym = beautifier.getAcronym(user.firstName, user.lastName);
        const fullname = beautifier.getFullname(user.firstName, user.lastName);
        const username = beautifier.getNormalizedUsername(user.userName);

        document.getElementById('profile-wdg-header-acronym').textContent = acronym;
        document.getElementById('profile-wdg-popup-acronym').textContent = acronym;
        document.getElementById('profile-wdg-fullname').textContent = fullname;
        document.getElementById('profile-wdg-username').textContent = username;
    },

    bindEvents() {
        if (DeviceUtils.getOS() === DeviceUtils.TARGET_LINUX) {
            document.getElementById('edit-profile').style.display = 'none';
        }

        document.getElementById('edit-profile').addEventListener('click', (e) => {
            e.preventDefault();

            switch (DeviceUtils.getOS()) {
            case DeviceUtils.TARGET_LINUX:
                rightPanel.openPanel('right-edit-profile');
                break;

            default:
                const protocol = 'olb';
                const targetUrl = 'deeplink/ces/edit-account';
                const baseUrl = EnvConfig.get(EnvConfig.CESConfig.CES_URL_EDIT_PROFILE);
                const url = `${baseUrl}?target_url=${targetUrl}&protocol=${protocol}&providerId=OLB_MOBILE`;

                openBrowser(url);
                break;
            }
            ga.screen(ga.SCREEN.UPDATE_MY_DETAILS);
        });

        document.getElementById('profile-widget-dropdown').addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Close the dropdown when focus is moved to outside the dropdown
        document.getElementById('profile-widget-dropdown').addEventListener('focusout', (e) => {
            if (!document.getElementById('profile-widget-dropdown').contains(e.relatedTarget)) {
                $('#profile-widget-open').dropdown('toggle');
            }
        });
    },

    registerIpcEventListener() {
        ipcRenderer.on('action-invalidate-user-details-response', () => {
            profileWidget.invalidate();
        });
    },

};

profileWidget.render();
profileWidget.registerIpcEventListener();

module.exports = profileWidget;