const { dialog } = require('electron');
const { autoUpdater } = require('electron-updater');  // @Link: https://www.electron.build/auto-update
const isDev = require('electron-is-dev');

const EnvConfig = require('../config/env-config');
const NetworkUtils = require('../utils/network-utils');
const DeviceUtils = require('../utils/device-utils');
const messages = require('../ods-share/ods-messages');

let checked = false;

function getPathFragment(target) {
    switch (target) {
    case DeviceUtils.TARGET_MAC:
        return '/osx-x64';

    case DeviceUtils.TARGET_LINUX:
        return '/linux-x64';

    default:
        return '/windows-ia32';
    }
}

function getFeedURL() {
    const baseURL = 'https://d1q4kqb8azk0w4.cloudfront.net/';

    return baseURL + EnvConfig.get(EnvConfig.OLBConfig.OLB_UPDATE_PATH_FRAGMENT) + getPathFragment(DeviceUtils.getOS());
}

function update() {
    if (checked) return;

    try {
        autoUpdater.setFeedURL(getFeedURL());

        autoUpdater
            .checkForUpdates()
            .then(() => {});

        // Electron Auto Updater extends EventEmitter in NodeJS
        // Link: https://nodejs.org/api/events.html#events_class_eventemitter
        autoUpdater
            .on('error', () => {})
            .on('checking-for-update', () => { checked = true; })
            .on('update-available', () => {})
            .on('update-not-available', () => {})
            .on('update-downloaded', (updateInfo) => {
                dialog.showMessageBox({
                    type: 'info',
                    buttons: ['Update on close', 'Update now'],
                    title: 'Software Update',
                    message: messages.application_update_available,
                    detail: messages.application_update_detail(updateInfo.version)
                }).then((result) => {
                    if (result.response === 1) {
                        autoUpdater.quitAndInstall();
                    }
                });
            });
    } catch (e) {
        console.error(e);
    }
}

function checkLatest() {
    /**
     *  DevMode should not check auto-update.
     *  Linux does not support auto-update. Check-Update will be added to the menu.
     */
    if (isDev) return null;

    return new Promise((resolve) => {
        NetworkUtils.checkNetworkStrictly((online) => {
            if (online) {
                global.device.online = online;

                update();
            }
            resolve();
        });
    });
}

module.exports = {
    checkLatest,
};