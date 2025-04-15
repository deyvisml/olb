"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const abs_database_1 = __importDefault(require("./abs-database"));
/**
 *  Store unsent Reading Diary Engagements to local database.
 */
class EngagementDatabase extends abs_database_1.default {
    get DATABASE_NAME() {
        return `database${path_1.default.sep}engagement.dat`;
    }
    insert(engagements) {
        return super.insert(engagements);
    }
    aggregate() {
        return super.aggregate({});
    }
    remove(query) {
        return super.remove(query, null);
    }
    static instance;
    static getInstance() {
        if (!EngagementDatabase.instance) {
            EngagementDatabase.instance = new EngagementDatabase();
        }
        return EngagementDatabase.instance;
    }
}
exports.default = EngagementDatabase.getInstance();
module.exports = EngagementDatabase.getInstance();
