"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const abs_database_1 = __importDefault(require("./abs-database"));
const exercise_status_entity_1 = require("./entity/exercise-status-entity");
class ExerciseStatusDatabase extends abs_database_1.default {
    get DATABASE_NAME() {
        return `database${path_1.default.sep}gradebook-exercises.dat`;
    }
    aggregate(query) {
        return super.aggregate(query);
    }
    find(query) {
        return super.find(query);
    }
    remove(query) {
        return super.remove(query);
    }
    async markAsSubmitted(userId, productId, exerciseId) {
        const query = { userId, productId, exerciseId };
        const exist = await this.find(query);
        await super.upsert(query, {
            userId: userId,
            productId: productId,
            exerciseId: exerciseId,
            status: exist?.status || exercise_status_entity_1.ExerciseStatus.SUBMITTED,
            submitted: true,
            revealed: exist?.revealed || false,
        });
    }
    async submitted(userId, productId, exerciseId) {
        const query = { userId, productId, exerciseId };
        const exist = await this.find(query);
        await super.upsert(query, {
            userId: userId,
            productId: productId,
            exerciseId: exerciseId,
            status: exercise_status_entity_1.ExerciseStatus.SUBMITTED,
            submitted: true,
            revealed: exist?.revealed || false,
        });
    }
    async cleared(userId, productId, exerciseId) {
        const query = { userId, productId, exerciseId };
        const exist = await this.find(query);
        return await super.upsert(query, {
            userId: userId,
            productId: productId,
            exerciseId: exerciseId,
            status: exercise_status_entity_1.ExerciseStatus.DEFAULT,
            submitted: exist?.submitted || false,
            revealed: exist?.revealed || false,
        });
    }
    revealed(userId, productId, exerciseId) {
        const query = { userId, productId, exerciseId };
        return super.upsert(query, {
            userId: userId,
            productId: productId,
            exerciseId: exerciseId,
            status: exercise_status_entity_1.ExerciseStatus.REVEALED,
            submitted: true,
            revealed: true,
        });
    }
}
module.exports = new ExerciseStatusDatabase();
