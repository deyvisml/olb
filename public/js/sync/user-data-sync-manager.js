const SyncActivityDB = require('../database/db-sync-user-activity');
const SyncDrawingDB = require('../database/db-sync-user-drawing');

const ITEM_NOT_FOUND = -1;

class UserDataSyncManager {

    get DATA_SYNC_DOC_VERSION() { return 3; }    // Version since Data Sync uses API.

    /**
     *  Check whether there is an out of sync data exist or not.
     */
    async isLatest(userId) {
        const activities = await SyncActivityDB.aggregate({ userName: userId });
        const drawings = await SyncDrawingDB.aggregate({ userName: userId });

        // Out of synced data saved with etag as null.
        return activities.findIndex(activity => activity.etag == null) === ITEM_NOT_FOUND
            && drawings.findIndex(drawing => drawing.etag == null) === ITEM_NOT_FOUND;
    }

    async saveLatestUserActivityData(
        { userId, bid, activityDataETag, drawingDataETag, userActivityData }
    ) {
        const query = { userName: userId, bid: bid };

        if (userActivityData?.activityData) {
            await SyncActivityDB.upsert(query, {
                userName: userId,
                bid: bid,
                data: userActivityData?.activityData,
                etag: activityDataETag,
            });
        }
        if (userActivityData?.drawingData) {
            await SyncDrawingDB.upsert(query, {
                userName: userId,
                bid: bid,
                data: userActivityData?.drawingData,
                etag: drawingDataETag,
            });
        }
    }
}

module.exports = new UserDataSyncManager();