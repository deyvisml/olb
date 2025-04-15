"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const net_request_1 = __importDefault(require("../utils/net-request"));
const auth_provider_1 = __importDefault(require("./auth-provider"));
const auth0_credential_1 = __importDefault(require("../ods-main/auth0/auth0-credential"));
const HTTP_STATUS_UNAUTHORIZED = 401;
const MAX_RETRY_COUNT = 2;
/**
 *  Request Middleware APIs and Retry and Renew Middleware Tokens if needed.
 */
async function middlewareRequest(params) {
    let retryCount = 0;
    params.headers = params.headers ?? {};
    while (retryCount++ < MAX_RETRY_COUNT) {
        try {
            params.headers['X-MW-Access-Token'] = await auth_provider_1.default.getAccessToken();
            return await (0, net_request_1.default)(params);
        }
        catch (error) {
            switch (error.statusCode) {
                case HTTP_STATUS_UNAUTHORIZED:
                    await auth_provider_1.default.renewAccessToken(); // Renew Middleware Tokens and Retry with renewed
                    // For some APIs(e.g. /api/v1/library), it requires valid CES User-Id-Token.
                    // Since the CES User-Id-Token can be renewed within AuthProvider.renewAccessToken().
                    // Set the latest CES User-Id-Token.
                    if (params.headers['User-Id-Token']) {
                        params.headers['User-Id-Token'] = auth0_credential_1.default.idToken;
                    }
                    break;
                default:
                    throw error; // Forward unhandled exception to caller
            }
        }
    }
    return null;
}
exports.default = middlewareRequest;
