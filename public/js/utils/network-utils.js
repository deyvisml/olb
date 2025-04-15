"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const request_1 = __importDefault(require("request"));
const NetworkUtils = {
    ONLINE: 'online',
    OFFLINE: 'offline',
    HOP: 'https://www.oxfordlearnersbookshelf.com',
    /**
     *  Check the network status by accessing www.oxfordlearnersbookshelf.com
     */
    checkNetworkStrictly(callback) {
        request_1.default.head(this.HOP, (error, response) => {
            let online = false;
            if (error === null && response) {
                if (response.statusCode >= 200 && response.statusCode < 400) {
                    online = true;
                }
            }
            callback(online);
        });
    },
    isOnline() {
        return global.device && global.device.online;
    },
    isOffline() {
        return !this.isOnline();
    }
};
exports.default = NetworkUtils;
module.exports = NetworkUtils;
