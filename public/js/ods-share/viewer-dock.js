"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_utils_1 = __importDefault(require("../utils/path-utils"));
const file_io_1 = __importDefault(require("../utils/file-io"));
const google_analytics_1 = __importDefault(require("../ods-renderer/utils/google-analytics"));
const user_repository_1 = __importDefault(require("../data/repository/user-repository"));
const library_repository_1 = __importDefault(require("../data/repository/library-repository"));
const diary_repository_1 = __importDefault(require("../data/repository/diary-repository"));
const db_sync_user_hidden_area_1 = __importDefault(require("../database/db-sync-user-hidden-area"));
const db_engagement_1 = __importDefault(require("../database/db-engagement"));
const game_runtime_js_1 = __importDefault(require("../game/game-runtime.js"));
const ods_scorm_js_1 = __importDefault(require("../ods-main/ods-scorm.js"));
const ods_rta_js_1 = __importDefault(require("../ods-main/ods-rta.js"));
const ods_gradebook_1 = __importDefault(require("../ods-main/ods-gradebook"));
const learning_record_service_1 = __importDefault(require("../middleware/learning-record-service"));
const content_service_1 = __importDefault(require("../middleware/content-service"));
const user_data_sync_opener_1 = __importDefault(require("../sync/user-data-sync-opener"));
const user_data_sync_closer_1 = __importDefault(require("../sync/user-data-sync-closer"));
const user_data_sync_add_audio_record_1 = __importDefault(require("../sync/record/user-data-sync-add-audio-record"));
const user_data_sync_remove_audio_record_1 = __importDefault(require("../sync/record/user-data-sync-remove-audio-record"));
const user_data_sync_get_audio_record_1 = __importDefault(require("../sync/record/user-data-sync-get-audio-record"));
const viewerDock = {
    PATH: {
        AUDIO_DIR: path_utils_1.default.audioPath.bind(path_utils_1.default), // @usage: viewerDock.PATH.AUDIO_DIR($userId)
        BOOK_DIR: path_utils_1.default.bookPath // @usage: viewerDock.PATH.BOOK_DIR
    },
    init(window) {
        // PathUtils.bookPath should be invalidated when the electron.app's ready event is fired.
        this.PATH.BOOK_DIR = path_utils_1.default.bookPath;
        this.bindIPC(window);
    },
    invalidatePaths() {
        this.PATH.BOOK_DIR = path_utils_1.default.bookPath;
    },
    *findBookFromCollections(bookId) {
        const collections = library_repository_1.default.getCachedCollections();
        if (collections == null || collections.length === 0)
            return;
        for (const collection of collections) {
            for (const book of collection.books) {
                if (book != null && book.id === bookId) {
                    yield book;
                }
            }
        }
    },
    /**
     *  Check the user has a license for the requested book and return true | false.
     *  This method is called from the viewer package.
     */
    checkLicenseForBook(bookId) {
        for (const book of this.findBookFromCollections(bookId)) {
            if (book.accessible) {
                return true;
            }
        }
        return false;
    },
    /**
     *  This method is called from the viewer package.
     */
    getBookMetadata(bookId) {
        const item = this.findBookFromCollections(bookId).next();
        return item.value;
    },
    async getBookMetadataForViewer(bookId) {
        const response = await content_service_1.default.getBookMetadata([bookId]);
        const bookMetadata = response.body?.msg?.content_list[0];
        const book = library_repository_1.default.getBook(bookId);
        return {
            author: book.author,
            bid: book.id,
            category: book.category,
            rcategory: book.category,
            cdn_download_url: book.downloadUrl,
            cefr_level: book.cefrLevel,
            content_version: book.version,
            credit: '',
            title: book.title,
            description: book.description,
            download_url: book.downloadUrl,
            ecommerce_url: book.eCommerceUrl,
            start_page: String(book.startPage),
            end_page: String(book.endPage),
            has_audio: bookMetadata?.has_audio ?? true,
            has_video: bookMetadata?.has_video ?? true,
            idx: bookMetadata?.idx ?? 0,
            is_cpt_coursebook: book.type.classroomPresentation ? '1' : '0',
            is_gradebook: book.type.gradebook ? '1' : '0',
            is_answer_showable: book.type.gradebookAnswerRevealable ? '1' : '0',
            isbn: book.isbn,
            list_thumbnail: book.thumbnailUrl,
            primary_target_age_group: bookMetadata?.primary_target_age_group ?? "",
            product_id: book.productId,
            publish_date_ebook: book.publishDate,
            reading_diary: book.readingDiary ? '1' : '0',
            size: String(book.size),
            teacher_resource_id: book.teacherResourceId || '',
            updated: book.updatedDate,
            word_count: String(book.wordCount),
            zip_download_url: book.zipDownloadUrl,
        };
    },
    /**
     *  Check the download status of the book and return true only if the book is downloaded and {bid}.asar is ready.
     *  This method is called from the viewer package.
     */
    isBookDownloaded(bookId) {
        const item = this.findBookFromCollections(bookId).next();
        const book = item.value;
        return (book != null
            && book.isDownloaded
            && file_io_1.default.checkExistAndClose(`${this.PATH.BOOK_DIR}${bookId}.asar`));
    },
    bindIPC(window) {
        /**
         *  Request Book Metadata with Pre-defined Scheme from Viewer.
         */
        electron_1.ipcMain.on('rdp-book-metadata-for-viewer', async (event, bookId) => {
            event.returnValue = await this.getBookMetadataForViewer(bookId);
        });
        /**
         *  Save & Restore User Activity Data
         */
        electron_1.ipcMain.on('viewer-user-activity-data-request', async (event, userId, bookId) => {
            const response = await new user_data_sync_opener_1.default(userId, bookId).execute();
            window.send('viewer-user-activity-data-response', response.data);
        });
        electron_1.ipcMain.on('viewer-user-activity-data-merge', async (event, userId, bookId, { activityData, activityDataETag, drawingData, drawingDataETag }) => {
            const response = await new user_data_sync_closer_1.default(userId, bookId, activityData, activityDataETag, drawingData, drawingDataETag).execute();
            window.send('viewer-user-activity-data-response', response.data);
        });
        electron_1.ipcMain.handle('viewer-user-activity-data-add-audio-record', async (event, userId, bookId, audioNoteId, recordData) => {
            return await new user_data_sync_add_audio_record_1.default()
                .execute(userId, bookId, audioNoteId, recordData);
        });
        electron_1.ipcMain.handle('viewer-user-activity-data-remove-audio-record', async (event, userId, bookId, audioNoteId) => {
            return await new user_data_sync_remove_audio_record_1.default().execute(userId, bookId, audioNoteId);
        });
        electron_1.ipcMain.handle('viewer-user-activity-data-get-audio-record', async (event, userId, bookId, audioNoteId) => {
            return await new user_data_sync_get_audio_record_1.default().execute(userId, bookId, audioNoteId);
        });
        /**
         *  Save & Restore Hidden Areas
         */
        electron_1.ipcMain.on('viewer-user-hidden-area-aggregate', async (event, userName, bid) => {
            event.returnValue = await db_sync_user_hidden_area_1.default.find({ userName, bid });
        });
        electron_1.ipcMain.on('viewer-user-hidden-area-save', async (_, userName, bid, data, eTag) => {
            await db_sync_user_hidden_area_1.default.upsert({ userName, bid }, {
                userName: userName,
                bid: bid,
                etag: eTag,
                data: data,
            });
        });
        electron_1.ipcMain.on('viewer-open-web', (_, url) => {
            electron_1.shell.openExternal(url);
        });
        electron_1.ipcMain.on('viewer-launch-widget', (_, url) => {
            const child = new electron_1.BrowserWindow({
                parent: window,
                modal: false,
                show: false,
                resizable: true,
                autoHideMenuBar: true,
                maximizable: true,
                minimizable: false,
                webPreferences: { nodeIntegration: false }
            });
            child.loadURL(url);
            child.setMenu(null);
            child.once('ready-to-show', () => {
                child.show();
            });
        });
        electron_1.ipcMain.on('viewer-launch-rta', (_, filename) => {
            ods_rta_js_1.default.launch(window, filename);
        });
        electron_1.ipcMain.on('viewer-launch-game', (_, gameName) => {
            game_runtime_js_1.default.launch(window, gameName);
        });
        electron_1.ipcMain.on('viewer-launch-scorm', (_, bid, scormPackageName) => {
            ods_scorm_js_1.default.launch(window, bid, scormPackageName);
        });
        electron_1.ipcMain.on('viewer-diary-send-engagement', async (_, engagements) => {
            try {
                await learning_record_service_1.default.submitReadingEngagements(engagements);
                await diary_repository_1.default.invalidate(global.user.id);
            }
            catch (e) {
                await db_engagement_1.default.insert({ data: engagements });
            }
        });
        electron_1.ipcMain.on('viewer-gradebook-update-exercise-status', (_, type, productId, exerciseId) => {
            if (type === 'clear') {
                ods_gradebook_1.default.clearExerciseStatus(global.user.id, productId, exerciseId);
            }
        });
        electron_1.ipcMain.on('viewer-gradebook-send-statement', (_, type, productId, exerciseId, statement) => {
            if (type === 'reveal') {
                ods_gradebook_1.default.sendRevealStatement(global.user.id, productId, exerciseId, statement);
            }
        });
        electron_1.ipcMain.on('viewer-gradebook-submit-exercise-answer', async (_, bookId, productId, exerciseId, score, revealed, answers) => {
            const user = await user_repository_1.default.get();
            await ods_gradebook_1.default.sendExerciseAnswer({
                userId: global.user.id,
                organizationIds: user.getOrganizationIds(),
                groupIds: library_repository_1.default.getAssignmentGroupIdsForBook(bookId),
                productId: productId,
                exerciseId: exerciseId,
                timestamp: Math.round(new Date().getTime() / 1000), // Convert to Unix Timestamp
                score: score,
                revealed: revealed,
                answers: answers,
            });
        });
        electron_1.ipcMain.on('viewer-gradebook-aggregate-status', async (event, productId) => {
            event.returnValue = await ods_gradebook_1.default.aggregateExerciseStatus(global.user.id, productId);
        });
        electron_1.ipcMain.on('viewer-gradebook-aggregate-submit-history', async (event, productId, exerciseIds) => {
            try {
                const result = await ods_gradebook_1.default.invalidateWorkbookStatementHistory(global.user.id, productId, exerciseIds);
                event.sender.send(`viewer-gradebook-aggregate-submit-history-reply${exerciseIds[0]}`, result);
            }
            catch (error) {
                event.sender.send(`viewer-gradebook-aggregate-submit-history-reply${exerciseIds[0]}`, error);
            }
        });
        electron_1.ipcMain.on('viewer-gradebook-aggregate-submit-count', async (event, productId) => {
            try {
                const result = await ods_gradebook_1.default.fetchExerciseSubmitCount(global.user.id, productId);
                event.sender.send(`viewer-gradebook-aggregate-submit-count-reply`, result);
            }
            catch (error) {
                event.sender.send(`viewer-gradebook-aggregate-submit-count-reply`, error);
            }
        });
        electron_1.ipcMain.on('viewer-ga-event', async (event, params) => {
            await google_analytics_1.default.sendEvent(params.category, params.action, params.label, params.customDimensions);
        });
    },
};
global['ods-dock'] = viewerDock;
module.exports = viewerDock;
