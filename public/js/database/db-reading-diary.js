"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const abs_database_1 = __importDefault(require("./abs-database"));
/**
 *  Store User's ReadingDiary (How many books read and reading. How many words are learned).
 */
class ReadingDiaryDatabase extends abs_database_1.default {
    get DATABASE_NAME() {
        return `database${path_1.default.sep}reading-diary.dat`;
    }
    upsert(query, entity) {
        return super.upsert(query, entity);
    }
    delete(query) {
        return super.remove(query);
    }
    find(query) {
        return super.find(query);
    }
    static instance;
    static getInstance() {
        if (!ReadingDiaryDatabase.instance) {
            ReadingDiaryDatabase.instance = new ReadingDiaryDatabase();
        }
        return ReadingDiaryDatabase.instance;
    }
}
exports.default = ReadingDiaryDatabase.getInstance();
module.exports = ReadingDiaryDatabase.getInstance();
