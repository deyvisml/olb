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
class SyncHiddenAreaDatabase extends abs_database_1.default {
    get DATABASE_NAME() {
        return `database${path_1.default.sep}sync-user-hidden-area.dat`;
    }
    upsert(query, entity) {
        return super.upsert(query, entity);
    }
    find(query) {
        return super.find(query);
    }
}
const exportObject = new SyncHiddenAreaDatabase();
exports.default = exportObject;
module.exports = exportObject;
