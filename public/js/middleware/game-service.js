"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_config_1 = __importDefault(require("../config/env-config"));
const middleware_service_1 = __importDefault(require("./middleware-service"));
class GameService {
    static BASE_URL = env_config_1.default.get(env_config_1.default.OLBConfig.OLB_MIDDLEWARE_HOSTNAME);
    async embeddedAssets(bookId) {
        return await (0, middleware_service_1.default)({
            method: 'GET',
            url: GameService.BASE_URL + `/game/v1/book/${bookId}`,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
    async engineDetails(engineIds) {
        return await (0, middleware_service_1.default)({
            method: 'GET',
            url: GameService.BASE_URL + `/game/v1/engines`,
            headers: {
                'Content-Type': 'application/json',
            },
            query: {
                engineIds: engineIds.join(',')
            }
        });
    }
    async contentDetails(contentIds) {
        return await (0, middleware_service_1.default)({
            method: 'GET',
            url: GameService.BASE_URL + `/game/v1/contents`,
            headers: {
                'Content-Type': 'application/json',
            },
            query: {
                contentIds: contentIds.join(',')
            }
        });
    }
}
exports.default = new GameService();
