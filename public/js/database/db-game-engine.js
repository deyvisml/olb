"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const abs_database_1 = __importDefault(require("./abs-database"));
/**
 *  Manage list and metadata for stored GameContent
 */
class GameEngineDatabase extends abs_database_1.default {
    get DATABASE_NAME() {
        return `database${path_1.default.sep}game-engine.dat`;
    }
    insert(entity) {
        return super.insert(entity);
    }
    remove(query) {
        return super.remove(query);
    }
    upsert(query, entity) {
        return super.upsert(query, entity);
    }
    find(query) {
        return super.find(query);
    }
    aggregate(query = {}) {
        return super.aggregate(query);
    }
    async exist(engineId) {
        const entity = await this.find({ engineId });
        return entity?.engineId === engineId;
    }
    static instance;
    static getInstance() {
        if (!GameEngineDatabase.instance) {
            GameEngineDatabase.instance = new GameEngineDatabase();
        }
        return GameEngineDatabase.instance;
    }
}
exports.default = GameEngineDatabase.getInstance();
module.exports = GameEngineDatabase.getInstance();
