"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ods_store_1 = __importDefault(require("../ods-main/ods-store"));
const ces_api_client_1 = __importDefault(require("../ods-main/ces/ces-api-client"));
const ces_auth_service_1 = __importDefault(require("../ods-main/ces/ces-auth-service"));
const auth_service_1 = __importDefault(require("./auth-service"));
const auth0_credential_1 = __importDefault(require("../ods-main/auth0/auth0-credential"));
class AuthProvider {
    static ACCESS_TOKEN_KEY = "middleware-access-token";
    static REFRESH_TOKEN_KEY = "middleware-refresh-token";
    async getAccessToken() {
        const accessToken = ods_store_1.default.get(AuthProvider.ACCESS_TOKEN_KEY);
        return accessToken ?? await this.issueTokens();
    }
    async renewAccessToken() {
        let accessToken;
        try {
            const refreshToken = ods_store_1.default.get(AuthProvider.REFRESH_TOKEN_KEY);
            const response = await auth_service_1.default.renewAccessToken(refreshToken);
            if (response.statusCode === 200 && response.body) {
                accessToken = response.body.accessToken;
                ods_store_1.default.set(AuthProvider.ACCESS_TOKEN_KEY, response.body.accessToken);
            }
        }
        catch (e) {
            accessToken = await this.issueTokens();
        }
        return accessToken;
    }
    async issueTokens(attemptCount = 0) {
        try {
            const idToken = auth0_credential_1.default.idToken;
            const response = await auth_service_1.default.issueAccessToken(idToken);
            if (response.statusCode === 200 && response.body) {
                ods_store_1.default.set(AuthProvider.ACCESS_TOKEN_KEY, response.body.accessToken);
                ods_store_1.default.set(AuthProvider.REFRESH_TOKEN_KEY, response.body.refreshToken);
            }
            return response?.body?.accessToken;
        }
        catch (e) {
            if (attemptCount === 0 && e.statusCode === 401) {
                if (await this.refreshCesIdToken()) {
                    return this.issueTokens(++attemptCount);
                }
                else if (attemptCount > 0 && e.statusCode === 403) {
                    this.requestSignout();
                    return null;
                }
            }
            else {
                return null;
            }
        }
    }
    async refreshCesIdToken() {
        const response = await ces_api_client_1.default.CLIENT.refreshIdToken();
        return ces_auth_service_1.default.CLIENT.isSuccessResponse(response);
    }
    requestSignout() {
        const pageRouter = require('../ods-main/router/page-router');
        pageRouter.pageRouteSignout();
    }
    revokeTokens() {
        ods_store_1.default.delete(AuthProvider.ACCESS_TOKEN_KEY);
        ods_store_1.default.delete(AuthProvider.REFRESH_TOKEN_KEY);
    }
}
const authProvider = new AuthProvider();
exports.default = authProvider;
module.exports = authProvider;
