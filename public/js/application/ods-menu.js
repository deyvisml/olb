const path = require('path');
const { spawn } = require('child_process');

const { Menu, BrowserWindow, app, dialog } = require('electron');

const EnvConfig = require('../config/env-config');
const DeviceUtils = require('../utils/device-utils');
const DeviceSettings = require('../utils/device-setting');
const NetworkUtils = require('../utils/network-utils');
const BookSharer = require('../ods-main/ods-book-sharer');
const ViewerDock = require('../ods-share/viewer-dock');
const messages = require('../ods-share/ods-messages');

const User = require('../data/user');

/**
 *  @References
 *  https://electronjs.org/docs/api/menu
 *  https://electronjs.org/docs/api/menu-item
 */
class ODSMenu {

    init(window) {
        this.window = window;
        this.menu = Menu.buildFromTemplate(this.menuTemplate);

        Menu.setApplicationMenu(this.menu);
    }

    login() {
        this.enableMenu(ODSMenu.Labels.SIGN_OUT);
        this.enableMenu(ODSMenu.Labels.ADD_BOOK);
    }

    logout() {
        this.disableMenu(ODSMenu.Labels.SIGN_OUT);
        this.disableMenu(ODSMenu.Labels.ADD_BOOK);
    }

    shouldShowSharedContentMenu(user) {
        if (user?.organizations && user?.organizations.length > 0) {
            for (const organization of user?.organizations) {
                if (organization.roleName === User.Roles.TEACHER_ADMIN) return true;
            }
        }
        return false;
    }

    bookshelf(user) {
        if (this.shouldShowSharedContentMenu(user)) {
            this.showMenu(ODSMenu.Labels.SHARED_DEVICE);

            if (DeviceSettings.has('share-content') && DeviceSettings.get('share-content', false)) {
                this.disableMenu(ODSMenu.Labels.SHARED_DEVICE);
            } else {
                this.enableMenu(ODSMenu.Labels.SHARED_DEVICE);
            }
        } else {
            this.hideMenu(ODSMenu.Labels.SHARED_DEVICE);
        }
    }

    startReading() {
        this.enableMenu(ODSMenu.Labels.SAVE_AND_CLOSE);
        this.disableMenu(ODSMenu.Labels.ADD_BOOK);
        this.disableMenu(ODSMenu.Labels.SIGN_OUT);
    }

    stopReading() {
        this.disableMenu(ODSMenu.Labels.SAVE_AND_CLOSE);
        this.enableMenu(ODSMenu.Labels.ADD_BOOK);
        this.enableMenu(ODSMenu.Labels.SIGN_OUT);
    }

    landing() {
        this.hideMenu(ODSMenu.Labels.SHARED_DEVICE);
    }

    getMenuItem(label, items = this.menu.items) {
        for (const item of items) {
            if (item.label === label) {
                return item;
            } else if (item.submenu && item.submenu.items && item.submenu.items.length > 0) {
                const itemFromSubmenu = this.getMenuItem(label, item.submenu.items);

                if (itemFromSubmenu) {
                    return itemFromSubmenu;
                }
            }
        }
        return null;
    }

    enableMenu(label) {
        const submenu = this.getMenuItem(label);

        if (submenu) {
            submenu.enabled = true;
        }
    }

    disableMenu(label) {
        const submenu = this.getMenuItem(label);

        if (submenu) {
            submenu.enabled = false;
        }
    }

    showMenu(label) {
        const submenu = this.getMenuItem(label);

        if (submenu) {
            submenu.visible = true;
        }
    }

    hideMenu(label) {
        const submenu = this.getMenuItem(label);

        if (submenu) {
            submenu.visible = false;
        }
    }

    get menuTemplate() {
        return [
            this.mainMenuTemplate,
            this.fileTemplate,
            this.editTemplate,
            this.viewTemplate,
            this.helpTemplate
        ];
    }

    get mainMenuTemplate() {
        const submenus = [this.aboutTemplate];

        if (DeviceUtils.getOS() !== DeviceUtils.TARGET_LINUX) {
            submenus.push(this.settingTemplate);
        }
        submenus.push(this.logoutTemplate);
        submenus.push({
            label: ODSMenu.Labels.CLOSE_OLB,
            role: 'quit'
        });

        return {
            label: ODSMenu.Labels.OLB,
            submenu: submenus
        };
    }

    get fileTemplate() {
        return {
            label: ODSMenu.Labels.FILE,
            submenu: [{
                label: ODSMenu.Labels.ADD_BOOK,
                enabled: false,
                click: () => {
                    this.window.send('menu-add-book');
                }
            }, {
                type: 'separator'
            }, {
                label: ODSMenu.Labels.SAVE_AND_CLOSE,
                enabled: false,
                click: () => {
                    this.window.send('view-dest-close-viewer');
                }
            }]
        };
    }

    get editTemplate() {
        return {
            label: ODSMenu.Labels.EDIT,
            submenu: [{
                label: ODSMenu.Labels.COPY,
                role: 'copy'
            }, {
                label: ODSMenu.Labels.CUT,
                role: 'cut'
            }, {
                label: ODSMenu.Labels.PASTE,
                role: 'paste'
            }, {
                label: ODSMenu.Labels.SELECT_ALL,
                role: 'selectall'
            }]
        };
    }

    get viewTemplate() {
        const submenu = [{
            label: ODSMenu.Labels.FULL_SCREEN,
            role: 'togglefullscreen'
        }];

        if (EnvConfig.isProd() === false) {
            submenu.push({
                label: ODSMenu.Labels.DEBUG,
                role: 'toggledevtools'
            });
        }

        return {
            label: ODSMenu.Labels.VIEW,
            submenu: submenu
        };
    }

    get helpTemplate() {
        return {
            label: ODSMenu.Labels.HELP,
            submenu: [{
                label: ODSMenu.Labels.HELP_OLB,
                click: () => {
                    this.window.webContents.send('menu-help');
                }
            }]
        };
    }

    get aboutTemplate() {
        const env = EnvConfig.isProd() ? '' : ` ${EnvConfig.Env}`;

        return {
            label: ODSMenu.Labels.ABOUT_OLB,
            click: () => {
                dialog.showMessageBox(this.window, {
                    type: 'info',
                    buttons: ['OK'],
                    title: 'About Oxford Learner\'s Bookshelf',
                    message: 'Oxford Learners Bookshelf',
                    detail: `Version ${global.application.version}${env}`
                });
            }
        };
    }

    get settingTemplate() {
        const submenu = [];

        // Remarks: Shared device should only be enabled from Windows.
        if (DeviceUtils.getOS() === DeviceUtils.TARGET_WIN) {
            submenu.push({
                label: ODSMenu.Labels.SHARED_DEVICE,
                enabled: false,
                visible: false,
                click: this.onSharedDeviceClicked.bind(this)
            });
        }
        submenu.push({
            // Uninstall-menu is required to provide an advisory message for the scenario of online/offline.
            label: ODSMenu.Labels.UNINSTALL,
            enabled: true,
            click: this.onUninstallRequest.bind(this)
        });

        return {
            label: ODSMenu.Labels.SETTINGS,
            submenu: submenu
        };
    }

    get logoutTemplate() {
        return {
            label: ODSMenu.Labels.SIGN_OUT,
            enabled: false,
            click: () => {
                this.window.send('menu-signout');
            }
        };
    }

    onSharedDeviceClicked() {
        dialog.showMessageBox({
            type: 'info',
            buttons: ['OK', 'Cancel'],
            title: 'Make this a shared device?',
            message: messages.application_shared_content_guide
        }).then((result) => {
            if (result.response === 0) {
                DeviceSettings.set('share-content', true);

                ViewerDock.invalidatePaths();
                BookSharer.movePublic();

                this.disableMenu(ODSMenu.Labels.SHARED_DEVICE);
            }
        });
    }

    onUninstallRequest() {
        dialog.showMessageBox({
            type: 'info',
            buttons: ['OK', 'Cancel'],
            title: 'Uninstall the Oxford Learner’s Bookshelf app',
            message: NetworkUtils.isOnline() ? messages.application_uninstall_guide : messages.application_uninstall_offline
        }).then((result) => {
            if (result.response === 0) {
                switch (DeviceUtils.getOS()) {
                    case DeviceUtils.TARGET_MAC:
                    case DeviceUtils.TARGET_LINUX:
                        this.uninstallMacLinux();
                        break;

                    case DeviceUtils.TARGET_WIN:
                    default:
                        this.uninstallWindows();
                        break;
                }
            }
        });
    }

    uninstallMacLinux() {
        const uninstallDialog = new BrowserWindow({
            parent: this.window,
            width: 300,
            height: 170,
            resizable: false,
            modal: false,
            show: true,
            frame: false,
            webPreferences: {
                nodeIntegration: true,
                enableRemoteModule: true,
                contextIsolation: false,
            }
        });
        uninstallDialog.loadURL(`file://${app.getAppPath()}/public/html/dialog/uninstall.html`);
    }

    uninstallWindows() {
        const appFolder = path.resolve(process.execPath, '..');
        const updateDotExe = path.resolve(path.join(appFolder, 'Uninstall Oxford Learners Bookshelf.exe'));

        this.window.destroy();

        app.quit();

        spawn(updateDotExe, { detached: true });
    }

}

ODSMenu.Labels = {
    // OLB Specific Labels
    OLB:            'Oxford Learner\'s Bookshelf',
    CLOSE_OLB:      'Close Oxford Learner\'s Bookshelf',
    ABOUT_OLB:      'About Oxford Learner\'s Bookshelf',
    HELP_OLB:       'Oxford Learner\'s Bookshelf Help',
    ADD_BOOK:       'Add Books',
    SAVE_AND_CLOSE: 'Save and Close Book',
    SHARED_DEVICE:  'Shared device',
    SIGN_OUT:         'Sign Out',

    // Common Labels
    HELP:           'Help',
    VIEW:           'View',
    FILE:           'File',
    EDIT:           'Edit',
    COPY:           'Copy',
    CUT:            'Cut',
    PASTE:          'Paste',
    UNINSTALL:      'Uninstall',
    SELECT_ALL:     'Select All',
    FULL_SCREEN:    'Full Screen',
    DEBUG:          'Debug',
    SETTINGS:       'Settings',
};

module.exports = new ODSMenu();