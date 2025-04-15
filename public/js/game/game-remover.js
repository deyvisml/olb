const FileIO = require("../utils/file-io");
const PathUtils = require("../utils/path-utils");
const GameBookDB = require("../database/db-game-book");
const GameEngineDB = require("../database/db-game-engine");
const GameContentDB = require("../database/db-game-content");
const { GameAssetType } = require('../database/entity/game-book-relation-entity');

const GameRemover = {

    // Delete Unused Game Engine & Content when the book is removed.
    async removeRelatedGameAssets(bid) {
        await GameBookDB.remove({ bid });

        await this.deleteEngines();
        await this.deleteContents();
    },

    async deleteEngines() {
        const engines = await GameEngineDB.aggregate();

        for (const engine of engines) {
            if (await GameBookDB.exist(GameAssetType.ENGINE, engine.engineId)) continue;

            this.deleteEngine(engine.engineId);
        }
    },

    async deleteContents() {
        const contents = await GameContentDB.aggregate();

        for (const content of contents) {
            if (await GameBookDB.exist(GameAssetType.CONTENT, content.contentId)) continue;

            this.deleteContent(content.contentId);
        }
    },

    deleteEngine(engineId) {
        FileIO.removeDir(PathUtils.gameEnginePath + engineId);

        GameEngineDB.remove({ engineId });
    },

    deleteContent(contentId) {
        FileIO.removeDir(PathUtils.gameContentPath + contentId);

        GameContentDB.remove({ contentId });
    },
}

module.exports = {
    removeRelatedGameAssets: GameRemover.removeRelatedGameAssets.bind(GameRemover),
};