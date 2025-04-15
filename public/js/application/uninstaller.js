const path = require('path');
const { spawn } = require('child_process');

const { app, dialog } = require('electron');

const FileIO = require('../utils/file-io');
const PathUtils = require('../utils/path-utils');
const DeviceUtils = require('../utils/device-utils');
const DeviceSetting = require('../utils/device-setting');
const messages = require('../ods-share/ods-messages');

function clearUserData() {
    try {
        FileIO.removeDir(`${PathUtils.baseDir}${path.sep}${global.application.env}`);   // Remove userdata within environment downloaded from ODS
        FileIO.removeDir(`${PathUtils.baseDir}${path.sep}.${global.application.env}`);  // Remove userdata within environment downloaded from ODS

        if (FileIO.isEmpty(PathUtils.baseDir)) {        // If there isn't any other environment data, then remove entire userdata.
            FileIO.removeDir(app.getPath('userData'));
        }
        if (DeviceSetting.get('share-content', false)) {
            DeviceSetting.set('share-content', false);

            FileIO.removeDir(PathUtils.publicBookPath);
            FileIO.removeDir(PathUtils.publicGamePath);
            FileIO.removeDir(DeviceSetting.publicDataPath);
            FileIO.removeDir(DeviceSetting.publicRootPath);
        }
    } catch (e) {
        console.error(e);
    }
}

function uninstallMacApplication() {
    try {
        const appPath = '/Applications/Oxford Learners Bookshelf.app';

        spawn('rm', ['-rf', appPath], {
            detached: true
        });
    } catch (e) {
        // failed to remove ODS.app from Mac
    }
}

// Uninstall for Mac & Linux. Window contains their own custom uninstall.exe
const uninstall = function uninstallApplication() {
    clearUserData();

    const options = {
        type: 'info',
        buttons: ['OK'],
        title: 'Uninstall complete',
        message: messages.application_uninstall_complete,
    };

    switch (DeviceUtils.getOS()) {
        case DeviceUtils.TARGET_MAC:
            dialog.showMessageBox(options).then(() => {
                app.quit();
                uninstallMacApplication();
            });
            break;

        case DeviceUtils.TARGET_LINUX:
            FileIO.removeFile(process.env.APPIMAGE);

            dialog.showMessageBox(options).then(() => {
                app.quit();
            });
            break;
    }
};

module.exports = uninstall;