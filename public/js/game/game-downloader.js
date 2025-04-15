"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const path_utils_1 = __importDefault(require("../utils/path-utils"));
const db_game_book_1 = __importDefault(require("../database/db-game-book"));
const db_game_engine_1 = __importDefault(require("../database/db-game-engine"));
const db_game_content_1 = __importDefault(require("../database/db-game-content"));
const game_service_1 = __importDefault(require("../middleware/game-service"));
const asset_downloader_1 = __importDefault(require("./asset-downloader"));
const asset_extractor_1 = __importDefault(require("./asset-extractor"));
const GameDownloader = {
    CHUNK_SIZE: 5,
    // Download Game Engine & Content
    async downloadGameAssets(bid) {
        const response = await game_service_1.default.embeddedAssets(bid);
        if (response.statusCode === 200 && response.body) {
            const { engines, contents } = response?.body?.response;
            await this.downloadEngines(bid, engines);
            await this.downloadContents(bid, contents);
        }
    },
    async downloadEngines(bid, engines) {
        if (engines == null || engines.length === 0)
            return;
        let start = 0;
        let end = 0;
        do {
            start = end;
            end = Math.min(end + this.CHUNK_SIZE, engines.length);
            const promises = [];
            for (const engine of engines.slice(start, end)) {
                promises.push(this.downloadEngine(engine));
                promises.push(db_game_book_1.default.insertEngine(bid, engine.engine_id));
            }
            await Promise.all(promises);
        } while (engines.length > end);
    },
    async downloadContents(bid, contents) {
        if (contents == null || contents.length === 0)
            return;
        let start = 0;
        let end = 0;
        do {
            start = end;
            end = Math.min(end + this.CHUNK_SIZE, contents.length);
            const promises = [];
            for (const content of contents.slice(start, end)) {
                promises.push(this.downloadContent(content));
                promises.push(db_game_book_1.default.insertContent(bid, content.content_id));
            }
            await Promise.all(promises);
        } while (contents.length > end);
    },
    async downloadEngine(engine) {
        if (await asset_downloader_1.default.isLatestEngineDownloaded(engine))
            return;
        const dir = path_utils_1.default.gameEnginePath + engine.engine_id;
        const filepath = `${dir}.zip`;
        try {
            if (await asset_downloader_1.default.saveToFile(engine.signed_url, filepath)) {
                await asset_extractor_1.default.extract(filepath, dir + path_1.default.sep, true);
                await db_game_engine_1.default.insert({
                    engineId: engine.engine_id,
                    engine: engine,
                });
            }
        }
        catch (e) {
            asset_extractor_1.default.recoverWithBackup(dir);
        }
    },
    async downloadContent(content) {
        if (await asset_downloader_1.default.isLatestContentDownloaded(content))
            return;
        const dir = path_utils_1.default.gameContentPath + content.content_id;
        const filepath = `${dir}.zip`;
        try {
            if (await asset_downloader_1.default.saveToFile(content.signed_url, filepath)) {
                await asset_extractor_1.default.extract(filepath, dir + path_1.default.sep, true);
                await db_game_content_1.default.insert({
                    contentId: content.content_id,
                    content: content,
                });
            }
        }
        catch (e) {
            asset_extractor_1.default.recoverWithBackup(dir);
        }
    },
};
const exportObject = {
    downloadGameAssets: GameDownloader.downloadGameAssets.bind(GameDownloader),
};
exports.default = exportObject;
module.exports = exportObject;
