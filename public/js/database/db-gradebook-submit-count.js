"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const abs_database_1 = __importDefault(require("./abs-database"));
class ExerciseSubmitCountDatabase extends abs_database_1.default {
    get DATABASE_NAME() {
        return `database${path_1.default.sep}gradebook-submit-count.dat`;
    }
    aggregate(query) {
        return super.aggregate(query);
    }
    async incrementSubmitCount(userId, productId, exerciseId) {
        const existSubmitCount = await this.find({ userId, productId, exerciseId });
        const count = (existSubmitCount && existSubmitCount.count) ? existSubmitCount.count + 1 : 1;
        await this.setSubmitCount(userId, productId, exerciseId, count);
    }
    async setSubmitCount(userId, productId, exerciseId, count) {
        const query = { userId, productId, exerciseId };
        const submitCountEntity = { userId, productId, exerciseId, count };
        await super.upsert(query, submitCountEntity);
    }
}
module.exports = new ExerciseSubmitCountDatabase();
