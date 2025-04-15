"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ods_store_1 = __importDefault(require("../../ods-main/ods-store"));
const config_service_1 = __importDefault(require("../../middleware/config-service"));
class PreferenceRepository {
    stringify(value) {
        switch (typeof value) {
            case 'number':
                return value.toString();
            case 'boolean':
                return value.toString();
            case 'object':
                return JSON.stringify(value);
        }
        return value;
    }
    async set(userId, key, value) {
        try {
            const cacheKey = `${userId}-${key}`;
            await config_service_1.default.setConfig(userId, key, this.stringify(value));
            ods_store_1.default.set(cacheKey, value);
        }
        catch (e) { }
    }
    async get(userId, key, defaultValue = false, forceLatest = false) {
        const cacheKey = `${userId}-${key}`;
        let result = ods_store_1.default.get(cacheKey, defaultValue);
        if (forceLatest) {
            try {
                result = await this.getLatest(userId, key);
                ods_store_1.default.set(cacheKey, result);
            }
            catch (e) { }
        }
        return result;
    }
    async getLatest(userId, key) {
        const response = await config_service_1.default.getConfig(userId, key);
        return response.body?.body;
    }
    static instance = new PreferenceRepository();
}
exports.default = PreferenceRepository.instance;
module.exports = PreferenceRepository.instance;
