"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const electron_settings_1 = __importDefault(require("electron-settings"));
const env_config_1 = __importDefault(require("../config/env-config"));
const device_utils_1 = __importDefault(require("./device-utils"));
const file_io_1 = __importDefault(require("./file-io"));
class DeviceSettings {
    constructor() {
        const settingFile = `${this.publicDataPath}${path_1.default.sep}settings.json`;
        try {
            this.createSharedFolders();
            electron_settings_1.default.setPath(settingFile);
            electron_settings_1.default.has('share-content'); // force to create file to change permission.
            file_io_1.default.chmodFile(settingFile, 0o777);
        }
        catch (e) {
            console.dir(e);
        }
    }
    has(key) {
        return electron_settings_1.default.has(key);
    }
    set(key, value) {
        electron_settings_1.default.set(key, value);
    }
    get(key, defaultValue) {
        return electron_settings_1.default.get(key, defaultValue);
    }
    createSharedFolders() {
        try {
            if (file_io_1.default.exist(this.publicDataPath) === false) {
                file_io_1.default.createDir(this.publicDataPath, 0o777);
            }
        }
        catch (ignore) {
            // If the application is executed without the required permissions, exception can occurred.
        }
    }
    get publicDataPath() {
        const sep = path_1.default.sep;
        return `${this.publicRootPath}${sep}.ods${sep}${env_config_1.default.Env}`;
    }
    get publicRootPath() {
        const sep = path_1.default.sep;
        switch (device_utils_1.default.getOS()) {
            case device_utils_1.default.TARGET_MAC:
                return `${sep}Users${sep}Shared${sep}Oxford Learners Bookshelf`;
            case device_utils_1.default.TARGET_WIN:
                return `C:${sep}Users${sep}Public${sep}AppData${sep}Roaming${sep}Oxford Learners Bookshelf`;
        }
        return null;
    }
}
const deviceSettings = new DeviceSettings();
exports.default = deviceSettings;
// CommonJS compatible export when the TypeScript migration complete, it can be removed.
module.exports = deviceSettings;
