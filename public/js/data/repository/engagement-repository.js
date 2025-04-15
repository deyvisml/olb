"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const network_utils_1 = __importDefault(require("../../utils/network-utils"));
const db_engagement_1 = __importDefault(require("../../database/db-engagement"));
const learning_record_service_1 = __importDefault(require("../../middleware/learning-record-service"));
const EngagementRepository = {
    isDeprecatedPendingEngagement(engagement) {
        return engagement?.data?.url != null;
    },
    async sendPendingEngagements(userId) {
        if (network_utils_1.default.isOffline())
            return;
        const engagements = await db_engagement_1.default.aggregate();
        const pendingEngagements = Array.isArray(engagements)
            ? engagements.filter(engagement => engagement.data.includes(userId))
            : [];
        const deprecatedPendingEngagements = pendingEngagements
            .filter(engagement => this.isDeprecatedPendingEngagement(engagement));
        const validPendingEngagements = pendingEngagements
            .filter(engagement => !this.isDeprecatedPendingEngagement(engagement));
        // Remove Deprecated Pending Engagement.
        for (const engagement of deprecatedPendingEngagements) {
            await db_engagement_1.default.remove({ _id: engagement['_id'] });
        }
        for (const engagement of validPendingEngagements) {
            try {
                const response = await learning_record_service_1.default.submitReadingEngagements(engagement.data);
                if (response.statusCode === 200) {
                    await db_engagement_1.default.remove({ _id: engagement['_id'] });
                }
            }
            catch (e) {
                console.error(e);
            }
        }
    },
    async hasPendingEngagements(userId) {
        const engagements = await db_engagement_1.default.aggregate();
        return engagements
            ?.filter(engagement => engagement.data.includes(userId))
            ?.length > 0;
    },
};
exports.default = EngagementRepository;
module.exports = EngagementRepository;
