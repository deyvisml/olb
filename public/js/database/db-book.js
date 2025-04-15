"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const abs_database_1 = __importDefault(require("./abs-database"));
/**
 *  Store Metadata of Book.
 */
class BookDatabase extends abs_database_1.default {
    get DATABASE_NAME() {
        return `database${path_1.default.sep}book.dat`;
    }
    upsert(query, bookEntity) {
        return super.upsert(query, bookEntity);
    }
    remove(query) {
        return super.remove(query, { multi: true });
    }
    find(query) {
        return super.find(query);
    }
}
const exportObject = new BookDatabase();
exports.default = exportObject;
module.exports = exportObject;
