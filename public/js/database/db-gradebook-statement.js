"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const abs_database_1 = __importDefault(require("./abs-database"));
class StatementDatabase extends abs_database_1.default {
    get DATABASE_NAME() {
        return `database${path_1.default.sep}gradebook-statement.dat`;
    }
    insert(statement) {
        return super.insert(statement);
    }
    remove(statement) {
        return super.remove(statement, {
            multi: true
        });
    }
    aggregate(query) {
        return super.aggregate(query);
    }
}
module.exports = new StatementDatabase();
