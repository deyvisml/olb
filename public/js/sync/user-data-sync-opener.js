"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const device_utils_1 = __importDefault(require("../utils/device-utils"));
const db_sync_user_activity_1 = __importDefault(require("../database/db-sync-user-activity"));
const db_sync_user_drawing_1 = __importDefault(require("../database/db-sync-user-drawing"));
const user_data_sync_manager_1 = __importDefault(require("./user-data-sync-manager"));
const audio_note_mapper_1 = __importDefault(require("./audio-note-mapper"));
const data_sync_service_1 = __importDefault(require("../middleware/data-sync-service"));
class UserDataSyncOpener {
    userId;
    bid;
    activityDataETag;
    drawingDataETag;
    localActivityData;
    remoteActivityData;
    drawingData;
    constructor(userId, bid) {
        this.userId = userId;
        this.bid = bid;
    }
    async onBeforeExecute() {
        const activityData = await db_sync_user_activity_1.default.find({
            userName: this.userId,
            bid: this.bid,
        });
        const drawingData = await db_sync_user_drawing_1.default.find({
            userName: this.userId,
            bid: this.bid,
        });
        this.activityDataETag = activityData?.etag;
        this.localActivityData = activityData?.data;
        this.remoteActivityData = activityData?.data;
        if (this.remoteActivityData) {
            this.remoteActivityData.audio_notes =
                audio_note_mapper_1.default.toRemoteAudioNote(activityData?.data.audio_notes || []);
        }
        this.drawingDataETag = drawingData?.etag;
        this.drawingData = drawingData?.data;
    }
    async onAfterExecute({ activityDataETag, drawingDataETag, userActivityData, }) {
        await user_data_sync_manager_1.default.saveLatestUserActivityData({
            userId: this.userId,
            bid: this.bid,
            activityDataETag: activityDataETag,
            drawingDataETag: drawingDataETag,
            userActivityData: userActivityData,
        });
    }
    async execute() {
        await this.onBeforeExecute();
        const response = await this.submitUserActivityData();
        const userActivityData = response?.body?.userActivityData || {
            activityData: this.remoteActivityData,
            drawingData: this.drawingData,
        };
        if (userActivityData.activityData) {
            userActivityData.activityData.audio_notes = audio_note_mapper_1.default.toLocalAudioNotes({
                remoteNotes: userActivityData.activityData.audio_notes || [],
                localNotes: this.localActivityData?.audio_notes || [],
            });
        }
        // If there is a change between local and server, then save the latest data from server to local database.
        // If local and server data are the same, userActivityData will be null.
        if (response?.statusCode === 200 && response?.body?.userActivityData) {
            await this.onAfterExecute({
                activityDataETag: response?.body?.activityDataETag,
                drawingDataETag: response?.body?.drawingDataETag,
                userActivityData: userActivityData,
            });
        }
        return {
            statusCode: response?.statusCode,
            data: {
                activityDataETag: response?.body?.activityDataETag || this.activityDataETag,
                drawingDataETag: response?.body?.drawingDataETag || this.drawingDataETag,
                userActivityData: userActivityData,
            }
        };
    }
    async submitUserActivityData() {
        return await data_sync_service_1.default.sync(this.userId, this.bid, 'Server', this.activityDataETag, this.drawingDataETag, {
            device: {
                os: 'ODS',
                id: device_utils_1.default.getMachineId(),
            },
            version: user_data_sync_manager_1.default.DATA_SYNC_DOC_VERSION,
            activityData: this.remoteActivityData,
            drawingData: this.drawingData,
        });
    }
}
exports.default = UserDataSyncOpener;
module.exports = UserDataSyncOpener;
