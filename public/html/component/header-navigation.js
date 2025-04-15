const $ = require('jquery');
const { ipcRenderer } = require('electron');
const EnvConfig = require('../js/config/env-config');

class HeaderNavigation extends HTMLElement {
    static OPEN_CLASS_SHORT_LABEL = {
        NO_ORG_WITH_GRADEBOOK: 'Progress',
        LEARNER: 'Progress',
        TEACHER: 'Classes',
        SENIOR_TEACHER: 'Classes',
        TEACHER_ADMIN: 'Classes',
        ORG_ADMIN: 'Classes',
    };

    static OPEN_CLASS_LONG_LABEL = {
        NO_ORG_WITH_GRADEBOOK: 'My progress',
        LEARNER: 'My progress',
        TEACHER: 'My classes',
        SENIOR_TEACHER: 'My classes',
        TEACHER_ADMIN: 'My classes',
        ORG_ADMIN: 'Manage classes',
    };

    static OPEN_CLASS_LINK = {
        NO_ORG_WITH_GRADEBOOK: `${EnvConfig.get(EnvConfig.CESConfig.OUP_HUB_BASE_URL)}/elt/my-progress`,
        LEARNER: `${EnvConfig.get(EnvConfig.CESConfig.OUP_HUB_BASE_URL)}/elt/my-progress`,
        TEACHER: `${EnvConfig.get(EnvConfig.CESConfig.OUP_HUB_BASE_URL)}/elt/my-classes`,
        SENIOR_TEACHER: `${EnvConfig.get(EnvConfig.CESConfig.OUP_HUB_BASE_URL)}/elt/my-classes`,
        TEACHER_ADMIN: `${EnvConfig.get(EnvConfig.CESConfig.OUP_HUB_BASE_URL)}/elt/my-classes`,
        ORG_ADMIN: `${EnvConfig.get(EnvConfig.CESConfig.OUP_HUB_BASE_URL)}/elt/my-org`,
    };

    static getRoleName() {
        const user = ipcRenderer.sendSync('rdp-user');
        const hasGradebook = ipcRenderer.sendSync('rdp-user-has-gradebook');
        const roleName = user.currentOrg?.roleName;

        return roleName || (hasGradebook ? 'NO_ORG_WITH_GRADEBOOK' : null);
    }

    static hideClassLink(roleName) {
        const hasGradebook = ipcRenderer.sendSync('rdp-user-has-gradebook');

        return roleName == null || (roleName === 'LEARNER' && !hasGradebook);
    }

    constructor() {
        super();

        this.innerHTML = `
<div class="navbar-divider">
    <div class="container">
        <div class="collapse-navbar-background side-collapse" data-toggle="collapse-side">

            <div id="navbar" class="collapse navbar-collapse side-collapse">
                <div class="navbar-platform">
                    <ul class="oup-hub-tab-container">
                        <button id='header-nav-bookshelf' class="oup-hub-primary-tab-box" tabindex="0"><a class="tab">Bookshelf</a></button>
                        <button id='header-nav-diary' class="oup-hub-primary-tab-box" tabindex="0"><a class="tab">Reading Diary</a></button>
                        <button id='header-nav-certificate' class="oup-hub-primary-tab-box" tabindex="0"><a class="tab">Certificate</a></button>
                        <div id='header-class-btn-group'>
                            ${this.renderClassButtonGroup()}
                        </div>
                    </ul>

                    <div class="pull-right">
                        <div id='nav-bar-search-box' class="col-sm-3 col-md-3">
                            <form id="book-search" class="navbar-search navbar-search-hide" role="search">
                                <div class="input-group search-container">
                                    <input type="text" class="form-control form-search" id="olb-search-keyword" placeholder="Title or CEFR level">
                                    <span class="input-group-btn">
                                        <button type="submit" class="btn btn-default btn-form btn-search icon-search"></button>
                                    </span>
                                </div>
                            </form>
                        </div>
                        
                        <div id="nav-bar-filter-box" class="dropdown pull-right">
                            <div id="book-filter" class="dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                <button type="button" class="btn btn-default btn-nav btn-filter" title="Filter">
                                    Filter
                                </button>
                            </div>
                            <div id="bookshelf-filter-dropdown" class="dropdown-menu" aria-labelledby="bookshelf-filter">
                                <div class="dropdown-label">Show:</div>
                                <ul class="bookshelf-filter-options">
                                    <li id="option-active" class="dropdown-item bookshelf-filter-option" data-name="active" data-show="true" tabindex="0">
                                        <div>Active</div>
                                    </li>
                                    <li id="option-expired" class="dropdown-item bookshelf-filter-option" data-name="expired" data-show="true" tabindex="0">
                                        <div>Expired</div>
                                    </li>
                                    <li id="option-unlicensed" class="dropdown-item bookshelf-filter-option" data-name="unlicensed" data-show="true" tabindex="0">
                                        <div>Without a licence</div>
                                    </li>
                                    <li id="option-samples" class="dropdown-item bookshelf-filter-option" data-name="sample" data-show="true" tabindex="0">
                                        <div>Samples and demos</div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>`;

        this.setActiveTab();
        this.invalidateSearchBox();
        this.bindEvents();
    }

    renderClassButtonGroup() {
        const roleName = HeaderNavigation.getRoleName();
        const hubLink = HeaderNavigation.OPEN_CLASS_LINK[roleName];
        const shortLabel = HeaderNavigation.OPEN_CLASS_SHORT_LABEL[roleName];
        const longLabel = HeaderNavigation.OPEN_CLASS_LONG_LABEL[roleName];
        const hideButtonClass = HeaderNavigation.hideClassLink(roleName) ? 'hide' : '';

        return `<button class="oup-hub-link-button short ${hideButtonClass}" tabindex="0" onClick="openBrowser('${hubLink}');">
                    ${shortLabel}<div class="link-img" title="New tab"></div>
                </button>
                <button class="oup-hub-link-button long ${hideButtonClass}" tabindex="0" onClick="openBrowser('${hubLink}');">
                    ${longLabel}<div class="link-img" title="New tab"></div>
                </button>`;
    }

    setActiveTab() {
        if (location.href.match('bookshelf.html')) {
            document.getElementById('header-nav-bookshelf').classList.add('selected');
        } else if (location.href.match('reading-diary.html')) {
            document.getElementById('header-nav-diary').classList.add('selected');
        } else if (location.href.match('certificate.html')) {
            document.getElementById('header-nav-certificate').classList.add('selected');
        }
    }

    invalidateSearchBox() {
        const display = location.href.match('bookshelf.html') ? 'block' : 'none';

        document.getElementById('nav-bar-search-box').style.display = display;
        document.getElementById('nav-bar-filter-box').style.display = display;
    }

    bookshelf() {
        ipcRenderer.send('view-dest-bookshelf');
    }

    readingDiary() {
        if (navigator.onLine === false) {
            alert('Please connect to the internet to update your Reading diary.');
        }
        ipcRenderer.send('view-dest-reading-diary');
    }

    certificate() {
        ipcRenderer.send('view-dest-certificate');
    }

    bindEvents() {
        document.getElementById('header-nav-bookshelf').addEventListener('click', () => {
            this.bookshelf();
        });

        document.getElementById('header-nav-diary').addEventListener('click', () => {
            this.readingDiary();
        });

        document.getElementById('header-nav-certificate').addEventListener('click', () => {
            this.certificate();
        });

        // Close the dropdown when focus is moved to outside the dropdown
        document.getElementById('bookshelf-filter-dropdown').addEventListener('focusout', (e) => {
            if (!document.getElementById('bookshelf-filter-dropdown').contains(e.relatedTarget)) {
                $('#book-filter').dropdown('toggle');
            }
        });
    }
}

customElements.define('header-navigation', HeaderNavigation);