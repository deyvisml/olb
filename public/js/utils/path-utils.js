"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const electron_1 = __importDefault(require("electron"));
const env_config_1 = __importDefault(require("../config/env-config"));
const device_setting_1 = __importDefault(require("./device-setting"));
const file_io_1 = __importDefault(require("./file-io"));
class PathUtils {
    userDir;
    baseDir;
    envDir;
    constructor() {
        const app = electron_1.default.app || require('@electron/remote').app;
        this.userDir = app.getPath('userData');
        this.baseDir = `${this.userDir}${path_1.default.sep}.ods`;
        this.envDir = `${this.baseDir}${path_1.default.sep}${env_config_1.default.Env}`;
        if (file_io_1.default.exist(this.baseDir) === false) {
            file_io_1.default.createDir(this.baseDir);
            file_io_1.default.hideDir(this.baseDir);
        }
        file_io_1.default.createDir(this.envDir);
        file_io_1.default.createDir(this.dataPath);
        file_io_1.default.createDir(this.bookPath);
        file_io_1.default.createDir(this.thumbPath);
        file_io_1.default.createDir(this.gameEnginePath);
        file_io_1.default.createDir(this.gameContentPath);
        this.createPublicFolders();
    }
    get appPath() {
        return electron_1.default.app.getAppPath();
    }
    get publicDataPath() {
        return device_setting_1.default.publicDataPath;
    }
    get dataPath() {
        return `${this.envDir + path_1.default.sep}data${path_1.default.sep}`;
    }
    get bookPath() {
        return device_setting_1.default.get('share-content', false) ? this.publicBookPath : this.privateBookPath;
    }
    get privateBookPath() {
        return `${this.dataPath}book${path_1.default.sep}`;
    }
    get publicBookPath() {
        return `${this.publicDataPath}${path_1.default.sep}book${path_1.default.sep}`;
    }
    get thumbPath() {
        return `${this.dataPath}thumb${path_1.default.sep}`;
    }
    get thumbPlaceholder() {
        return `${this.appPath}${path_1.default.sep}public${path_1.default.sep}images${path_1.default.sep}ods${path_1.default.sep}placeholder.png`;
    }
    get gamePath() {
        return device_setting_1.default.get('share-content', false) ? this.publicGamePath : this.privateGamePath;
    }
    get privateGamePath() {
        return `${this.dataPath}game${path_1.default.sep}`;
    }
    get publicGamePath() {
        return `${this.publicDataPath}${path_1.default.sep}game${path_1.default.sep}`;
    }
    get gameEnginePath() {
        return `${this.gamePath}engine${path_1.default.sep}`;
    }
    get gameContentPath() {
        return `${this.gamePath}contents${path_1.default.sep}`;
    }
    audioPath(userId) {
        const dir = `${this.dataPath}audio${path_1.default.sep}${userId}`;
        file_io_1.default.createDir(dir);
        return dir + path_1.default.sep;
    }
    getFilenameFromURL(url) {
        let filename = null;
        try {
            filename = url.substring(url.lastIndexOf('/') + 1);
        }
        catch (ignore) { }
        return filename;
    }
    createPublicFolders() {
        file_io_1.default.createDir(device_setting_1.default.publicRootPath, 0o777);
        file_io_1.default.createDir(device_setting_1.default.publicDataPath, 0o777);
        file_io_1.default.createDir(this.publicBookPath, 0o777);
        file_io_1.default.createDir(this.publicGamePath, 0o777);
    }
}
const pathUtils = new PathUtils();
exports.default = pathUtils;
module.exports = pathUtils;
