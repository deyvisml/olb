"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_config_1 = __importDefault(require("../config/env-config"));
const middleware_service_1 = __importDefault(require("./middleware-service"));
const user_repository_1 = __importDefault(require("../data/repository/user-repository"));
const library_repository_1 = __importDefault(require("../data/repository/library-repository"));
class LearningRecordService {
    static BASE_URL = env_config_1.default.get(env_config_1.default.OLBConfig.OLB_MIDDLEWARE_HOSTNAME);
    async getReadingStats() {
        const user = user_repository_1.default.getCurrent();
        const assignmentGroupIds = library_repository_1.default.getAssignmentGroupIds();
        return await (0, middleware_service_1.default)({
            method: 'GET',
            url: LearningRecordService.BASE_URL + '/learning-record/v1/engagements/stats',
            headers: {
                'Content-Type': 'application/json',
                'X-Organisations': JSON.stringify(user?.getOrganizationIds()),
                'X-Assignments': JSON.stringify(assignmentGroupIds),
            },
            query: {
                userId: user.userId,
            },
        });
    }
    async updateHideStats(bid, hiddenFlag) {
        const user = user_repository_1.default.getCurrent();
        const assignmentGroupIds = library_repository_1.default.getAssignmentGroupIds();
        return await (0, middleware_service_1.default)({
            method: 'PUT',
            url: LearningRecordService.BASE_URL + `/learning-record/v1/engagements/stats/${bid}`,
            headers: {
                'Content-Type': 'application/json',
                'X-Organisations': JSON.stringify(user?.getOrganizationIds()),
                'X-Assignments': JSON.stringify(assignmentGroupIds),
            },
            body: JSON.stringify({
                "hidden_flag": hiddenFlag,
            }),
            query: {
                userId: user.userId,
            },
        });
    }
    async getReadingCertificate(username, format) {
        const user = user_repository_1.default.getCurrent();
        const assignmentGroupIds = library_repository_1.default.getAssignmentGroupIds();
        return await (0, middleware_service_1.default)({
            method: 'GET',
            url: LearningRecordService.BASE_URL + `/learning-record/v1/engagements/certificate`,
            headers: {
                'Content-Type': (format === 'csv') ? 'text/csv' : 'application/pdf',
                'X-Organisations': JSON.stringify(user?.getOrganizationIds()),
                'X-Assignments': JSON.stringify(assignmentGroupIds),
                'X-User-Name': username,
            },
            query: {
                userId: user.userId,
            },
        });
    }
    async submitReadingEngagements(engagements) {
        return await (0, middleware_service_1.default)({
            method: 'POST',
            url: LearningRecordService.BASE_URL + '/learning-record/v1/engagements',
            headers: {
                'Content-Type': 'application/json',
            },
            body: engagements,
        });
    }
    async submitRevealStatements(statements) {
        return await (0, middleware_service_1.default)({
            method: 'POST',
            url: LearningRecordService.BASE_URL + '/learning-record/v1/statements/reveal',
            headers: {
                'Content-Type': 'application/json',
            },
            body: statements,
        });
    }
    async submitAnswerStatements(statements) {
        return await (0, middleware_service_1.default)({
            method: 'POST',
            url: LearningRecordService.BASE_URL + '/learning-record/v1/answer',
            headers: {
                'Content-Type': 'application/json',
            },
            body: statements,
        });
    }
    async aggregateSubmittedHistory(productId, exerciseIds) {
        const user = user_repository_1.default.getCurrent();
        return await (0, middleware_service_1.default)({
            method: 'GET',
            url: LearningRecordService.BASE_URL + '/learning-record/v1/statements/exercise',
            headers: {
                'Content-Type': 'application/json',
            },
            query: {
                userId: user.userId,
                productId: productId,
                exerciseId: exerciseIds.join(",")
            },
        });
    }
    async aggregateSubmitCount(productId) {
        const user = user_repository_1.default.getCurrent();
        return await (0, middleware_service_1.default)({
            method: 'GET',
            url: LearningRecordService.BASE_URL + '/learning-record/v1/statements/exercise/count',
            headers: {
                'Content-Type': 'application/json',
            },
            query: {
                userId: user.userId,
                productId: productId,
            },
        });
    }
}
const service = new LearningRecordService();
exports.default = service;
module.exports = service;
