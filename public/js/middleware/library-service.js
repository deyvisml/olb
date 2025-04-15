"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_config_1 = __importDefault(require("../config/env-config"));
const middleware_service_1 = __importDefault(require("./middleware-service"));
class MiddlewareService {
    static BASE_URL = env_config_1.default.get(env_config_1.default.OLBConfig.OLB_MIDDLEWARE_HOSTNAME);
    async getLibraryCollections(cesIdToken) {
        return await (0, middleware_service_1.default)({
            method: 'GET',
            url: MiddlewareService.BASE_URL + `/api/v1/library`,
            headers: {
                'Content-Type': 'application/json',
                'User-Id-Token': cesIdToken,
            }
        });
    }
}
exports.default = new MiddlewareService();
