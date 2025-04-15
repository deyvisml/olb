"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigKey = void 0;
const env_config_1 = __importDefault(require("../config/env-config"));
const middleware_service_1 = __importDefault(require("./middleware-service"));
var ConfigKey;
(function (ConfigKey) {
    ConfigKey["TEACHER_RESOURCE_TERMS_ACCEPTED"] = "teacher-resource-terms-accepted";
    ConfigKey["BOOKSHELF_BOOK_FILTER"] = "bookshelf-book-filter";
    ConfigKey["AUTO_SYNC"] = "auto-sync";
    ConfigKey["LTI_USER_TERMS_ACCEPTED"] = "lti-user-terms-accepted";
    ConfigKey["TOOLBAR_POSITION"] = "toolbar-position";
})(ConfigKey || (exports.ConfigKey = ConfigKey = {}));
class ConfigService {
    static BASE_URL = env_config_1.default.get(env_config_1.default.OLBConfig.OLB_MIDDLEWARE_HOSTNAME);
    async getConfig(userId, key) {
        return await (0, middleware_service_1.default)({
            method: 'GET',
            url: ConfigService.BASE_URL + `/config/v1/user/${userId}`,
            headers: {
                'Content-Type': 'application/json',
                'X-Preference-Key': key,
            },
        });
    }
    async setConfig(userId, key, value) {
        return await (0, middleware_service_1.default)({
            method: 'POST',
            url: ConfigService.BASE_URL + `/config/v1/user/${userId}`,
            headers: {
                'Content-Type': 'application/json',
                'X-Preference-Key': key,
                'X-Preference-Value': value,
            },
        });
    }
}
exports.default = new ConfigService();
