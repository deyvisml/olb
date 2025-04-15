"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const data_sync_service_1 = __importDefault(require("../../middleware/data-sync-service"));
// noinspection JSUnresolvedVariable
class UserDataSyncRemoveAudioRecord {
    async execute(userId, bid, audioNoteId) {
        try {
            const { statusCode, body, } = await data_sync_service_1.default.removeAudioNote(userId, bid, audioNoteId);
            return {
                statusCode: statusCode,
                data: body,
            };
        }
        catch (e) {
            return {
                statusCode: e.statusCode ?? 500,
                data: e.error,
            };
        }
    }
}
exports.default = UserDataSyncRemoveAudioRecord;
module.exports = UserDataSyncRemoveAudioRecord;
