"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const abs_database_1 = __importDefault(require("./abs-database"));
const game_book_relation_entity_1 = require("./entity/game-book-relation-entity");
/**
 *  Store game engines and contents which are embedded to a book.
 */
class GameBookDatabase extends abs_database_1.default {
    get DATABASE_NAME() {
        return `database${path_1.default.sep}game-book.dat`;
    }
    insertEngine(bid, engineId) {
        return super.insert({
            type: game_book_relation_entity_1.GameAssetType.ENGINE,
            bid: bid,
            game_id: engineId,
        });
    }
    insertContent(bid, contentId) {
        return super.insert({
            type: game_book_relation_entity_1.GameAssetType.CONTENT,
            bid: bid,
            game_id: contentId,
        });
    }
    remove(query) {
        return super.remove(query, { multi: true });
    }
    async exist(type, gameAssetId) {
        const exist = await super.find({ type: type, game_id: gameAssetId });
        return exist?.game_id === gameAssetId;
    }
    static instance;
    static getInstance() {
        if (!GameBookDatabase.instance) {
            GameBookDatabase.instance = new GameBookDatabase();
        }
        return GameBookDatabase.instance;
    }
}
exports.default = GameBookDatabase.getInstance();
module.exports = GameBookDatabase.getInstance();
