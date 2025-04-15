"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = __importDefault(require("os"));
const ces_api_client_1 = __importDefault(require("../../ods-main/ces/ces-api-client"));
const db_user_1 = __importDefault(require("../../database/db-user"));
const user_1 = __importDefault(require("../user"));
const data_source_1 = require("./data-source");
/**
 *  Provide User
 */
class UserRepository {
    user;
    osProfileName = os_1.default.userInfo().username;
    async create() {
        const response = await ces_api_client_1.default.API.getIdentityDetails();
        if (response.success) {
            this.user = user_1.default.Factory.buildFromAPI(this.osProfileName, response.body.data);
            this.set(this.user);
        }
        // @ts-ignore
        return this.user || response;
    }
    async invalidate() {
        try {
            const response = await ces_api_client_1.default.API.getIdentityDetails();
            if (this.user && ces_api_client_1.default.API.isRequestSucceed(response)) {
                this.user.invalidateDetails(response.body.data);
                this.set(this.user);
            }
        }
        catch (e) {
            console.error(e);
        }
        return this.user;
    }
    async get(source = data_source_1.DataSource.Local) {
        switch (source) {
            case data_source_1.DataSource.Remote:
                return this.getLatest();
            case data_source_1.DataSource.Local:
            default:
                return this.getCached();
        }
    }
    async getLatest() {
        return await this.invalidate();
    }
    async getCached() {
        if (this.user == null) {
            const user = await db_user_1.default.find({
                osProfileName: this.osProfileName,
            });
            this.user = user_1.default.Factory.buildFromDB(user);
        }
        return this.user;
    }
    getCurrent() {
        return this.user;
    }
    set(user) {
        this.user = user;
        this.user.globalize();
        // @ts-ignore
        db_user_1.default.upsert({ osProfileName: this.osProfileName }, user);
    }
    clear() {
        this.user = null;
        db_user_1.default.remove({ osProfileName: this.osProfileName });
    }
    static instance;
    static getInstance() {
        if (!UserRepository.instance) {
            UserRepository.instance = new UserRepository();
        }
        return UserRepository.instance;
    }
}
exports.default = UserRepository.getInstance();
module.exports = UserRepository.getInstance();
