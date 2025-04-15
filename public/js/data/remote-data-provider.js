"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
const env_config_1 = __importDefault(require("../config/env-config"));
const path_utils_1 = __importDefault(require("../utils/path-utils"));
const asar_reader_1 = __importDefault(require("../utils/asar-reader"));
const data_source_1 = require("./repository/data-source");
const user_repository_1 = __importDefault(require("./repository/user-repository"));
const library_repository_1 = __importDefault(require("./repository/library-repository"));
const diary_repository_1 = __importDefault(require("./repository/diary-repository"));
const engagement_repository_1 = __importDefault(require("./repository/engagement-repository"));
const preference_repository_1 = __importDefault(require("./repository/preference-repository"));
const auth0_credential_1 = __importDefault(require("../ods-main/auth0/auth0-credential"));
const ces_preprocessor_1 = __importDefault(require("../ods-main/ces/ces-preprocessor"));
const ods_store_1 = __importDefault(require("../ods-main/ods-store"));
const ods_gradebook_1 = __importDefault(require("../ods-main/ods-gradebook"));
const user_data_sync_manager_1 = __importDefault(require("../sync/user-data-sync-manager"));
const game_updater_1 = __importDefault(require("../game/game-updater"));
const RemoteDataProvider = {
    init() {
        electron_1.ipcMain.on('rdp-ces-rules', (event) => {
            event.returnValue = ces_preprocessor_1.default.getCommonVariable();
        });
        electron_1.ipcMain.on('rdp-ces-id-token', async (event) => {
            event.returnValue = auth0_credential_1.default.idToken;
        });
        electron_1.ipcMain.on('rdp-ces-learn-more', (event) => {
            event.returnValue = ces_preprocessor_1.default.getCommonContent();
        });
        electron_1.ipcMain.on('rdp-environment', (event, key) => {
            event.returnValue = env_config_1.default.get(key);
        });
        electron_1.ipcMain.on('rdp-deeplink', (event) => {
            event.returnValue = global['action-deeplink'];
            global['action-deeplink'] = null;
        });
        electron_1.ipcMain.on('rdp-pending-deeplink', (event, pendingDeeplink) => {
            if (pendingDeeplink) {
                global['action-pending-deeplink'] = pendingDeeplink;
                event.returnValue = pendingDeeplink;
            }
            else {
                event.returnValue = global['action-pending-deeplink'];
                global['action-pending-deeplink'] = null;
            }
        });
        electron_1.ipcMain.on('rdp-user', async (event) => {
            event.returnValue = await user_repository_1.default.get();
        });
        electron_1.ipcMain.on('rdp-user-preference', async (event, key, defaultValue = false, forceLatest = true) => {
            event.returnValue = await preference_repository_1.default.get(global.user.id, key, defaultValue, forceLatest);
        });
        electron_1.ipcMain.on('rdp-user-has-gradebook', async (event) => {
            const collections = await library_repository_1.default.get(global.user.id, data_source_1.DataSource.Local);
            for (const collection of collections) {
                if (collection?.books?.length > 0) {
                    for (const book of collection.books) {
                        if (book.type.gradebook && book.accessible) {
                            event.returnValue = true;
                            return;
                        }
                    }
                }
            }
            event.returnValue = false;
        });
        electron_1.ipcMain.on('rdp-collections', async (event) => {
            event.returnValue = await library_repository_1.default.get(global.user.id, data_source_1.DataSource.Local);
        });
        electron_1.ipcMain.on('rdp-collection', async (event, params) => {
            const collections = await library_repository_1.default.get(global.user.id, data_source_1.DataSource.Local);
            for (const collection of collections) {
                if (collection[params.key] === params.value) {
                    event.returnValue = collection;
                    break;
                }
            }
            event.returnValue = null;
        });
        electron_1.ipcMain.on('rdp-collection-contain-bid', async (event, params) => {
            const collections = await library_repository_1.default.get(global.user.id, data_source_1.DataSource.Local);
            for (const collection of collections) {
                if (collection && collection.books && collection.books.length > 0) {
                    for (const book of collection.books) {
                        if (book.id === params.bid) {
                            event.returnValue = collection;
                            return;
                        }
                    }
                }
            }
            event.returnValue = null;
        });
        electron_1.ipcMain.on('rdp-book', (event, bid, cid) => {
            event.returnValue = library_repository_1.default.getBook(bid, cid);
        });
        electron_1.ipcMain.on('rdp-read-text-file-from-asar', (event, filepath) => {
            const bid = global['action-open-book'].bid;
            const normalizedPath = filepath.replace(path_1.default.sep, asar_reader_1.default.URI_SEPARATOR);
            const resourcePath = `${path_utils_1.default.bookPath}${bid}.asar/${normalizedPath}`;
            const data = asar_reader_1.default.readFile(resourcePath, bid);
            event.returnValue = data.toString('utf8');
        });
        electron_1.ipcMain.on('rdp-reading-dairy', async (event) => {
            event.returnValue = await diary_repository_1.default.get(global.user.id);
        });
        electron_1.ipcMain.on('rdp-should-escort-boarding', async (event) => {
            const modalKey = `${global.user.id}-boarding`;
            event.returnValue = ods_store_1.default.get(`modal-unrevealed-${modalKey}`, true);
        });
        electron_1.ipcMain.on('rdp-should-escort-whatsnew', async (event) => {
            const modalKey = `${global.user.id}-${global.application.version}`;
            event.returnValue = ods_store_1.default.get(`modal-unrevealed-${modalKey}`, true);
        });
        electron_1.ipcMain.on('rdp-bookshelf-sync-required', async (event) => {
            const activityDataSynced = await user_data_sync_manager_1.default.isLatest(global.user.id);
            const hasPendingStatements = await ods_gradebook_1.default.hasPendingStatements(global.user.id);
            const hasPendingEngagements = await engagement_repository_1.default.hasPendingEngagements(global.user.id);
            event.returnValue = !activityDataSynced || hasPendingStatements || hasPendingEngagements;
        });
        electron_1.ipcMain.on('rdp-diary-sync-required', async (event) => {
            const hasPendingStatements = await ods_gradebook_1.default.hasPendingStatements(global.user.id);
            const hasPendingEngagements = await engagement_repository_1.default.hasPendingEngagements(global.user.id);
            event.returnValue = hasPendingStatements || hasPendingEngagements;
        });
        electron_1.ipcMain.on('rdp-game-request-status', async (event) => {
            event.sender.send('rdp-game-latest-status', await game_updater_1.default.getUpdateStatus());
        });
    },
};
module.exports = RemoteDataProvider;
