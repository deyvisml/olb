const { dialog, ipcMain } = require('electron');
const menu = require('../../application/ods-menu');
const uninstaller = require('../../application/uninstaller');

const NetworkUtils = require('../../utils/network-utils');
const Gradebook = require('../ods-gradebook');
const LibraryRepository = require('../../data/repository/library-repository');
const EngagementRepository = require('../../data/repository/engagement-repository');

const UserDataSyncManager = require('../../sync/user-data-sync-manager')
const SyncPendingUserData = require('../../sync/sync-pending-user-data')
const messages = require('../../ods-share/ods-messages');
const DiaryRepository = require('../../data/repository/diary-repository');

/**
 *  Events are fired from system.
 */
const EventRouter = {

    register(window) {
        ipcMain.on('menu-status-signin', () => {
            menu.login();
        });

        ipcMain.on('menu-status-signout', () => {
            menu.logout();
        });

        ipcMain.on('app-exit', () => {
            window.destroy();
            window = null;
        });

        ipcMain.on('app-uninstall-request', uninstaller);

        ipcMain.on('dialog-temporarily-unavailable', () => {
            dialog.showMessageBox({
                type: 'info',
                buttons: ['OK'],
                title: 'Service Temporarily Unavailable',
                message: messages.service_temporarily_unavailable,
            });
        });

        ipcMain.on('dialog-invalid-timestamp', () => {
            const signin = window.getURL().includes('landing.html');

            dialog.showMessageBox({
                type: 'info',
                buttons: ['OK'],
                title: 'Device Date & Time is not correct.',
                message: signin ? messages.date_and_time_is_not_valid_signin : messages.date_and_time_is_not_valid_bookshelf,
            });

            if (signin) {
                window.reload();
            }
        });


        ipcMain.on('network-status-initialize', (event, online) => {
            global.device.online = online;
        });

        ipcMain.on('network-status-changed', (event, online) => {
            this.onNetworkStatusChanged(online);

            if (global.user && global.user.id && online) {
                UserDataSyncManager.isLatest(global.user.id).then((latest) => {
                    if (latest) return;

                    this.submitPendingReadingDiaryAndUserActivityData(event);
                });
            }
        });

        ipcMain.on('online-status-changed-viewer', (event, online) => {
            this.onNetworkStatusChanged(online);

            if (global.user && global.user.id) {
                Gradebook.sendPendingStatements(global.user.id).then(() => {
                    // pending statements has been sent.
                });
            }
        });

        ipcMain.on('rdp-bookshelf-sync-start', (event) => {
            this.submitPendingReadingDiaryAndUserActivityData(event);
        });

        ipcMain.on('rdp-diary-sync-start', (event) => {
            this.submitPendingReadingDiaryData(event);
        });
    },

    onNetworkStatusChanged(newStatus) {
        global.device.online = newStatus;
    },

    async submitPendingReadingDiaryAndUserActivityData(event) {
        if (NetworkUtils.isOffline()) return;

        event.sender.send('rdp-bookshelf-sync-on-started');

        await new SyncPendingUserData(global.user.id).execute();
        await Gradebook.sendPendingStatements(global.user.id);
        await EngagementRepository.sendPendingEngagements(global.user.id);
        await DiaryRepository.invalidate(global.user.id);

        event.sender.send('rdp-bookshelf-sync-on-completed');

        // Invalidating Bookshelf with the latest data. Reading Progress can be updated.
        event.sender.send('view-bookshelf-invalidate', await LibraryRepository.invalidate(global.user.id));
    },

    async submitPendingReadingDiaryData(event) {
        if (NetworkUtils.isOffline()) return;

        event.sender.send('rdp-diary-sync-on-started');

        await Gradebook.sendPendingStatements(global.user.id);
        await EngagementRepository.sendPendingEngagements(global.user.id);
        await DiaryRepository.invalidate(global.user.id);

        event.sender.send('rdp-diary-sync-on-completed');
    },
};

module.exports = EventRouter;