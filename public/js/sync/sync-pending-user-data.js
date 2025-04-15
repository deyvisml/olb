const DeviceUtils = require('../utils/device-utils');
const SyncActivityDB = require("../database/db-sync-user-activity");
const SyncDrawingDB = require("../database/db-sync-user-drawing");
const UserDataSyncManager = require('./user-data-sync-manager');
const AudioNoteMapper = require('./audio-note-mapper');
const DataSyncService = require('../middleware/data-sync-service');

class SyncPendingUserData {
    constructor(userId) {
        this.userId = userId;
    }

    async saveLatestUserActivityData({
        bid,
        activityDataETag,
        drawingDataETag,
        userActivityData,
    }) {
        await UserDataSyncManager.saveLatestUserActivityData({
            userId: this.userId,
            bid,
            activityDataETag,
            drawingDataETag,
            userActivityData
        });
    }

    async execute() {
        const activities = await SyncActivityDB.aggregate({
            userName: this.userId,
            etag: { $exists: false }, // Find an item with etag is undefined.
        });

        for (const activityData of activities) {
            const { bid } = activityData;
            const localAudioNotes = activityData?.data.audio_notes || [];
            const drawingData = await SyncDrawingDB.find({
                userName: this.userId,
                bid: bid,
            });

            activityData.data.audio_notes = AudioNoteMapper.toRemoteAudioNote(localAudioNotes || []);

            const response = await this.mergePendingActivityData(
                bid, activityData.data, activityData.etag, drawingData.data, drawingData.etag,
            );

            // If there is a change between local and remote, then save the remote data to local database.
            if (response?.statusCode === 200 && response?.body?.userActivityData) {
                const { activityDataETag, drawingDataETag, userActivityData } = response.body;

                userActivityData.activityData.audio_notes = AudioNoteMapper.toLocalAudioNotes({
                    remoteNotes: userActivityData.activityData.audio_notes || [],
                    localNotes: localAudioNotes,
                });

                await this.saveLatestUserActivityData({
                    bid, activityDataETag, drawingDataETag, userActivityData,
                });
            }
        }
    }

    async mergePendingActivityData(bid, activityData, activityDataETag, drawingData, drawingDataETag) {
        return await DataSyncService.sync(
            this.userId,
            bid,
            'Client',
            activityDataETag,
            drawingDataETag,
            {
                device: {
                    os: 'ODS',
                    id: DeviceUtils.getMachineId(),
                },
                version: UserDataSyncManager.DATA_SYNC_DOC_VERSION,
                activityData: activityData,
                drawingData: drawingData,
            },
        );
    }
}

module.exports = SyncPendingUserData;