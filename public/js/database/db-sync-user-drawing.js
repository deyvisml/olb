"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const abs_database_1 = __importDefault(require("./abs-database"));
/**
 *  Store User's drawing on page.
 */
class SyncDrawingDatabase extends abs_database_1.default {
    get DATABASE_NAME() {
        return `database${path_1.default.sep}sync-user-drawing.dat`;
    }
    upsert(query, entity) {
        return super.upsert(query, entity);
    }
    find(query) {
        return super.find(query);
    }
    aggregate(query) {
        return super.aggregate(query);
    }
    static instance;
    static getInstance() {
        if (!SyncDrawingDatabase.instance) {
            SyncDrawingDatabase.instance = new SyncDrawingDatabase();
        }
        return SyncDrawingDatabase.instance;
    }
}
exports.default = SyncDrawingDatabase.getInstance();
module.exports = SyncDrawingDatabase.getInstance();
