"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_config_1 = __importDefault(require("../config/env-config"));
const middleware_service_1 = __importDefault(require("./middleware-service"));
class ContentService {
    static BASE_URL = env_config_1.default.get(env_config_1.default.OLBConfig.OLB_MIDDLEWARE_HOSTNAME);
    MAX_CHUNK_SIZE = 500;
    async getBookMetadata(bookIds) {
        try {
            return await (0, middleware_service_1.default)({
                method: 'GET',
                url: ContentService.BASE_URL + `/content/v1/book`,
                headers: {
                    'Content-Type': 'application/json',
                },
                query: {
                    bid: bookIds.join(','),
                }
            });
        }
        catch (error) {
            return error;
        }
    }
    async getCollectionMetadata(collectionIds) {
        try {
            return await (0, middleware_service_1.default)({
                method: 'GET',
                url: ContentService.BASE_URL + `/content/v1/collection`,
                headers: {
                    'Content-Type': 'application/json',
                },
                query: {
                    cid: collectionIds.join(','),
                }
            });
        }
        catch (error) {
            return error;
        }
    }
    async getSignedUrl(url) {
        return await (0, middleware_service_1.default)({
            method: 'GET',
            url: ContentService.BASE_URL + `/content/v1/book/signed-url`,
            headers: {
                'Content-Type': 'application/json',
            },
            query: {
                url: url,
            }
        });
    }
}
const service = new ContentService();
exports.default = service;
module.exports = service;
