"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_config_1 = __importDefault(require("../config/env-config"));
const net_request_1 = __importDefault(require("../utils/net-request"));
class AuthService {
    static TOKEN_PROVIDER = 'ces';
    static BASE_URL = env_config_1.default.get(env_config_1.default.OLBConfig.OLB_MIDDLEWARE_HOSTNAME);
    async issueAccessToken(cesIdToken) {
        return await (0, net_request_1.default)({
            method: 'GET',
            url: AuthService.BASE_URL + '/auth/v1/token/issue',
            headers: {
                'X-Token-Provider': AuthService.TOKEN_PROVIDER,
                'X-User-Token': cesIdToken,
            },
        });
    }
    async renewAccessToken(refreshToken) {
        return await (0, net_request_1.default)({
            method: 'GET',
            url: AuthService.BASE_URL + '/auth/v1/token/renew',
            headers: {
                'X-MW-Refresh-Token': refreshToken,
            },
        });
    }
}
const service = new AuthService();
exports.default = service;
module.exports = service;
