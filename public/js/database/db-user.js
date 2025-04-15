"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const abs_database_1 = __importDefault(require("./abs-database"));
/**
 *  Store User Information (Username and Details, EAC ID). OS Username is used as a Key.
 */
class UserDatabase extends abs_database_1.default {
    get DATABASE_NAME() {
        return `database${path_1.default.sep}user.dat`;
    }
    upsert(query, entity) {
        return super.upsert(query, entity);
    }
    remove(query) {
        return super.remove(query, { multi: true });
    }
    find(query) {
        return super.find(query);
    }
}
exports.default = new UserDatabase();
