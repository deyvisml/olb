"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const device_utils_1 = __importDefault(require("../utils/device-utils"));
const user_data_sync_manager_1 = __importDefault(require("./user-data-sync-manager"));
const audio_note_mapper_1 = __importDefault(require("./audio-note-mapper"));
const data_sync_service_1 = __importDefault(require("../middleware/data-sync-service"));
// noinspection JSUnresolvedVariable
class UserDataSyncCloser {
    userId;
    bid;
    activityDataETag;
    drawingDataETag;
    localActivityData;
    remoteActivityData;
    drawingData;
    constructor(userId, bid, activityData, activityDataETag, drawingData, drawingDataETag) {
        this.userId = userId;
        this.bid = bid;
        this.localActivityData = { ...activityData };
        this.remoteActivityData = { ...activityData };
        this.remoteActivityData.audio_notes = audio_note_mapper_1.default.toRemoteAudioNote(activityData?.audio_notes || []);
        this.activityDataETag = activityDataETag;
        this.drawingData = drawingData;
        this.drawingDataETag = drawingDataETag;
    }
    async onAfterExecute({ activityDataETag, drawingDataETag, userActivityData, }) {
        await user_data_sync_manager_1.default.saveLatestUserActivityData({
            userId: this.userId,
            bid: this.bid,
            activityDataETag,
            drawingDataETag,
            userActivityData,
        });
    }
    async execute() {
        const response = await this.submitUserActivityData();
        const userActivityData = response?.body?.userActivityData || {
            activityData: this.remoteActivityData,
            drawingData: this.drawingData,
        };
        userActivityData.activityData.audio_notes = audio_note_mapper_1.default.toLocalAudioNotes({
            remoteNotes: userActivityData.activityData.audio_notes || [],
            localNotes: this.localActivityData?.audio_notes || [],
        });
        await this.onAfterExecute({
            activityDataETag: response?.body?.activityDataETag,
            drawingDataETag: response?.body?.drawingDataETag,
            userActivityData: userActivityData,
        });
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
        return await data_sync_service_1.default.sync(this.userId, this.bid, 'Client', this.activityDataETag, this.drawingDataETag, {
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
exports.default = UserDataSyncCloser;
module.exports = UserDataSyncCloser;
