"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
const file_io_1 = __importDefault(require("../../utils/file-io"));
const path_utils_1 = __importDefault(require("../../utils/path-utils"));
const { uid } = os_1.default.userInfo();
class Auth0Credential {
    static DIR = `${path_utils_1.default.dataPath}.tokens${path_1.default.sep}`;
    static PATH = {
        ID_TOKEN: `${Auth0Credential.DIR}ces-id-token-${uid}.txt`,
        REFRESH_TOKEN: `${Auth0Credential.DIR}ces-refresh-token-${uid}.txt`,
    };
    static ID_TOKEN = null;
    static REFRESH_TOKEN = null;
    static get idToken() {
        if (Auth0Credential.ID_TOKEN == null && fs_1.default.existsSync(Auth0Credential.PATH.ID_TOKEN)) {
            Auth0Credential.ID_TOKEN =
                electron_1.safeStorage.decryptString(fs_1.default.readFileSync(Auth0Credential.PATH.ID_TOKEN));
        }
        return Auth0Credential.ID_TOKEN;
    }
    static get refreshToken() {
        if (Auth0Credential.REFRESH_TOKEN == null && fs_1.default.existsSync(Auth0Credential.PATH.REFRESH_TOKEN)) {
            Auth0Credential.REFRESH_TOKEN =
                electron_1.safeStorage.decryptString(fs_1.default.readFileSync(Auth0Credential.PATH.REFRESH_TOKEN));
        }
        return Auth0Credential.REFRESH_TOKEN;
    }
    static set({ idToken, refreshToken }) {
        file_io_1.default.createDir(Auth0Credential.DIR);
        file_io_1.default.hideDir(Auth0Credential.DIR);
        Auth0Credential.ID_TOKEN = idToken;
        file_io_1.default.writeFile(Auth0Credential.PATH.ID_TOKEN, electron_1.safeStorage.encryptString(idToken));
        if (refreshToken) {
            Auth0Credential.REFRESH_TOKEN = refreshToken;
            file_io_1.default.writeFile(Auth0Credential.PATH.REFRESH_TOKEN, electron_1.safeStorage.encryptString(refreshToken));
        }
    }
    static clear() {
        Auth0Credential.ID_TOKEN = null;
        Auth0Credential.REFRESH_TOKEN = null;
        file_io_1.default.removeFile(Auth0Credential.PATH.ID_TOKEN);
        file_io_1.default.removeFile(Auth0Credential.PATH.REFRESH_TOKEN);
    }
    static hasValidCredentials() {
        return Auth0Credential.idToken && Auth0Credential.refreshToken;
    }
}
exports.default = Auth0Credential;
module.exports = Auth0Credential;
