"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const abs_database_1 = __importDefault(require("./abs-database"));
class ExerciseAnswerDatabase extends abs_database_1.default {
    get DATABASE_NAME() {
        return `database${path_1.default.sep}gradebook-answer.dat`;
    }
    insert(entity) {
        return super.insert(entity);
    }
    remove(entity) {
        return super.remove(entity, { multi: true });
    }
    aggregate(query) {
        return super.aggregate(query);
    }
}
module.exports = new ExerciseAnswerDatabase();
