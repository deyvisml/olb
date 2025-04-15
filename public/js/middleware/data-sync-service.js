"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_config_1 = __importDefault(require("../config/env-config"));
const middleware_service_1 = __importDefault(require("./middleware-service"));
class DataSyncService {
    static BASE_URL = env_config_1.default.get(env_config_1.default.OLBConfig.OLB_MIDDLEWARE_HOSTNAME);
    static ACCOUNT_PROVIDER = "eac";
    async sync(userId, bookId, preferredSource, activityDataETag, drawingDataETag, userActivityData) {
        try {
            return await (0, middleware_service_1.default)({
                method: 'POST',
                url: DataSyncService.BASE_URL + `/activity-data/v1/sync`,
                headers: {
                    'X-Account-Provider': DataSyncService.ACCOUNT_PROVIDER,
                    'X-Preferred-Source': preferredSource,
                },
                body: JSON.stringify({
                    userID: userId,
                    bid: bookId,
                    activityDataETag: activityDataETag,
                    drawingDataETag: drawingDataETag,
                    userActivityData: userActivityData,
                }),
            });
        }
        catch (e) {
            return e;
        }
    }
    async getAudioNote(userId, bookId, audioNoteId) {
        return await (0, middleware_service_1.default)({
            method: 'GET',
            url: DataSyncService.BASE_URL + `/activity-data/v1/audio-note`,
            headers: {
                'Content-Type': 'application/json',
                'X-Account-Provider': DataSyncService.ACCOUNT_PROVIDER,
            },
            query: {
                userId: userId,
                bid: bookId,
                audioNoteId: audioNoteId,
            }
        });
    }
    async addAudioNote(userId, bookId, audioNoteId, recordData) {
        return await (0, middleware_service_1.default)({
            method: 'POST',
            url: DataSyncService.BASE_URL + `/activity-data/v1/audio-note`,
            headers: {
                'X-Account-Provider': DataSyncService.ACCOUNT_PROVIDER,
            },
            body: JSON.stringify({
                userID: userId,
                bid: bookId,
                audioNoteId: audioNoteId,
                recordData: recordData,
            }),
        });
    }
    async removeAudioNote(userId, bookId, audioNoteId) {
        return await (0, middleware_service_1.default)({
            method: 'DELETE',
            url: DataSyncService.BASE_URL + `/activity-data/v1/audio-note`,
            headers: {
                'X-Account-Provider': DataSyncService.ACCOUNT_PROVIDER,
            },
            body: JSON.stringify({
                userID: userId,
                bid: bookId,
                audioNoteId: audioNoteId,
            }),
        });
    }
}
exports.default = new DataSyncService();
module.exports = new DataSyncService();
