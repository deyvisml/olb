"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const path_utils_1 = __importDefault(require("../utils/path-utils"));
const file_io_1 = __importDefault(require("../utils/file-io"));
const db_game_book_1 = __importDefault(require("../database/db-game-book"));
const db_game_engine_1 = __importDefault(require("../database/db-game-engine"));
const db_game_content_1 = __importDefault(require("../database/db-game-content"));
const game_book_relation_entity_1 = require("../database/entity/game-book-relation-entity");
const asset_downloader_1 = __importDefault(require("../game/asset-downloader"));
const asset_extractor_1 = __importDefault(require("./asset-extractor"));
const game_service_1 = __importDefault(require("../middleware/game-service"));
const data_source_1 = require("../data/repository/data-source");
const library_repository_1 = __importDefault(require("../data/repository/library-repository"));
const GameUpdater = {
    UPDATE_STATUS: {
        DONE: 0,
        REQUIRED: 1,
        PROGRESSING: 2,
    },
    async getUpdateStatus() {
        try {
            const updateRequiredEngines = await this.getOutdatedEngines();
            const updateRequiredContents = await this.getOutdatedContents();
            const assets = await this.aggregateAssetsForDownloadedBooks();
            const assetsAreReady = await this.checkAssetsAreRegistered(assets);
            if ((updateRequiredEngines && updateRequiredEngines.length > 0)
                || (updateRequiredContents && updateRequiredContents.length > 0)
                || !assetsAreReady) {
                return GameUpdater.UPDATE_STATUS.REQUIRED;
            }
            else {
                return GameUpdater.UPDATE_STATUS.DONE;
            }
        }
        catch (e) {
            return GameUpdater.UPDATE_STATUS.DONE;
        }
    },
    async getOutdatedEngines() {
        const outdatedEngines = [];
        try {
            const entities = await db_game_engine_1.default.aggregate();
            if (entities && entities.length > 0) {
                const engineIds = entities.map(engine => engine.engineId);
                const response = await game_service_1.default.engineDetails(engineIds);
                const latestEngineInfos = response.body.response;
                for (const downloadedEngine of entities) {
                    if (asset_downloader_1.default.isEngineDownloaded(downloadedEngine.engineId)
                        && !this.isOutdatedEngine(downloadedEngine, latestEngineInfos))
                        continue;
                    outdatedEngines.push(latestEngineInfos.find((latestEngine) => {
                        return latestEngine.engine_id === downloadedEngine.engineId;
                    }));
                }
            }
        }
        catch (ignore) { }
        return outdatedEngines;
    },
    async getOutdatedContents() {
        const outdatedContents = [];
        try {
            const entities = await db_game_content_1.default.aggregate(); // Extract downloaded contents.
            if (entities && entities.length > 0) {
                const contentIds = entities.map(content => content.contentId);
                const response = await game_service_1.default.contentDetails(contentIds);
                const latestContentInfos = response.body.response;
                for (const downloadedContent of entities) {
                    if (asset_downloader_1.default.isContentDownloaded(downloadedContent.contentId)
                        && !this.isOutdatedContent(downloadedContent, latestContentInfos))
                        continue;
                    outdatedContents.push(latestContentInfos.find((latestContent) => {
                        return latestContent.content_id === downloadedContent.contentId;
                    }));
                }
            }
        }
        catch (ignore) { }
        return outdatedContents;
    },
    isOutdatedEngine(local, latestEngines) {
        for (const latest of latestEngines) {
            if (local.engine.engine_id === latest.engine_id && local.engine.version !== latest.version) {
                return true;
            }
        }
        return false;
    },
    isOutdatedContent(local, latestContents) {
        for (const latest of latestContents) {
            if (local.content.content_id === latest.content_id && local.content.version !== latest.version) {
                return true;
            }
        }
        return false;
    },
    async aggregateAssetsForDownloadedBooks() {
        const assets = {};
        const collections = await library_repository_1.default.get(global.user.id, data_source_1.DataSource.Local);
        if (collections) {
            for (const collection of collections) {
                for (const book of collection.books) {
                    try {
                        if (!book?.type.classroomPresentation || !book.isDownloaded)
                            continue;
                        const response = await game_service_1.default.embeddedAssets(book.id);
                        assets[book.id] = response.body.response;
                    }
                    catch (ignore) { }
                }
            }
        }
        return assets;
    },
    // Check the required engines and contents are registered to the database.
    async checkAssetsAreRegistered(assets) {
        for (const bid in assets) {
            if (!Object.prototype.hasOwnProperty.call(assets, bid))
                continue;
            if (assets[bid].engines && assets[bid].engines.length > 0) {
                for (const engine of assets[bid].engines) {
                    if (await this.isEngineRegisteredInDB(engine.engine_id) === false) {
                        return false;
                    }
                }
            }
            if (assets[bid].contents && assets[bid].contents.length > 0) {
                for (const content of assets[bid].contents) {
                    if (await this.isContentRegisteredInDB(content.content_id) === false) {
                        return false;
                    }
                }
            }
        }
        return true;
    },
    async isEngineRegisteredInDB(engineId) {
        const bookExist = await db_game_book_1.default.exist(game_book_relation_entity_1.GameAssetType.ENGINE, engineId);
        const engineExist = await db_game_engine_1.default.exist(engineId);
        return bookExist && engineExist;
    },
    async isContentRegisteredInDB(contentId) {
        const bookExist = await db_game_book_1.default.exist(game_book_relation_entity_1.GameAssetType.CONTENT, contentId);
        const contentExist = await db_game_content_1.default.exist(contentId);
        return bookExist && contentExist;
    },
    // Check the required assets(Engines and Contents) are registered in database.
    // If required assets are not registered in database. Insert before download and update.
    async fillMissingAssets(assets) {
        const engines = [];
        const contents = [];
        for (const bid in assets) {
            if (!Object.prototype.hasOwnProperty.call(assets, bid))
                continue;
            if (assets[bid]?.engines?.length > 0) {
                for (const engine of assets[bid].engines) {
                    if (await this.isEngineRegisteredInDB(engine.engine_id) === false) {
                        await db_game_book_1.default.insertEngine(bid, engine.engine_id);
                        engines.push(engine);
                    }
                }
            }
            if (assets[bid]?.contents?.length > 0) {
                for (const content of assets[bid].contents) {
                    if (await this.isContentRegisteredInDB(content.content_id) === false) {
                        await db_game_book_1.default.insertContent(bid, content.content_id);
                        contents.push(content);
                    }
                }
            }
        }
        return { engines, contents };
    },
    async updateOutdatedAssets(window) {
        const outdatedEngines = await this.getOutdatedEngines();
        const outdatedContents = await this.getOutdatedContents();
        const assets = await this.aggregateAssetsForDownloadedBooks();
        const missing = await this.fillMissingAssets(assets);
        for (const outdatedEngine of outdatedEngines.concat(missing.engines)) {
            await this.downloadEngine(outdatedEngine);
        }
        for (const outdatedContent of outdatedContents.concat(missing.contents)) {
            await this.downloadContent(outdatedContent);
        }
        window.webContents.send('view-bookshelf-game-update-done');
    },
    async downloadEngine(engine) {
        if (await asset_downloader_1.default.isLatestEngineDownloaded(engine))
            return;
        const dir = path_utils_1.default.gameEnginePath + engine.engine_id;
        const filepath = `${dir}.zip`;
        try {
            if (await asset_downloader_1.default.saveToFile(engine.signed_url, filepath)) {
                if (file_io_1.default.exist(dir))
                    file_io_1.default.rename(dir, `${dir}_old`);
                await asset_extractor_1.default.extract(filepath, dir + path_1.default.sep, true);
                await db_game_engine_1.default.upsert({ engineId: engine.engine_id }, {
                    engineId: engine.engine_id,
                    engine: engine,
                });
                file_io_1.default.removeDir(`${dir}_old`);
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
                if (file_io_1.default.exist(dir))
                    file_io_1.default.rename(dir, `${dir}_old`);
                await asset_extractor_1.default.extract(filepath, dir + path_1.default.sep, true);
                await db_game_content_1.default.upsert({ contentId: content.content_id }, {
                    contentId: content.content_id,
                    content: content,
                });
                file_io_1.default.removeDir(`${dir}_old`);
            }
        }
        catch (e) {
            asset_extractor_1.default.recoverWithBackup(dir);
        }
    },
};
exports.default = {
    getUpdateStatus: GameUpdater.getUpdateStatus.bind(GameUpdater),
    updateOutdatedAssets: GameUpdater.updateOutdatedAssets.bind(GameUpdater),
};
module.exports = {
    getUpdateStatus: GameUpdater.getUpdateStatus.bind(GameUpdater),
    updateOutdatedAssets: GameUpdater.updateOutdatedAssets.bind(GameUpdater),
};
