"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const file_io_1 = __importDefault(require("../../utils/file-io"));
const path_utils_1 = __importDefault(require("../../utils/path-utils"));
const ods_store_1 = __importDefault(require("../../ods-main/ods-store"));
const auth0_credential_1 = __importDefault(require("../../ods-main/auth0/auth0-credential"));
const ces_parser_1 = require("../../ods-main/ces/ces-parser");
const data_source_1 = require("./data-source");
const library_service_1 = __importDefault(require("../../middleware/library-service"));
const model_mapper_1 = require("../../middleware/scheme/model-mapper");
class LibraryRepository {
    static CACHE_FILE_PREFIX = 'library.collections-';
    collections;
    clear() {
        this.collections = [];
    }
    getCachedCollections() {
        return this.collections;
    }
    async invalidate(userId) {
        const collections = await this.getCollectionsFromRemoteDataSource();
        if (collections && collections?.length > 0) {
            this.collections = collections;
            ods_store_1.default.set(`${LibraryRepository.CACHE_FILE_PREFIX}${userId}`, collections);
        }
        return this.collections;
    }
    async get(userId, dataSource) {
        switch (dataSource) {
            case data_source_1.DataSource.Remote:
                this.collections = await this.getCollectionsFromRemoteDataSource();
                ods_store_1.default.set(`${LibraryRepository.CACHE_FILE_PREFIX}${userId}`, this.collections);
                break;
            case data_source_1.DataSource.Local:
                this.collections = this.getCollectionsFromLocalDataSource(userId);
                if (this.collections == null || this.collections.length == 0) {
                    this.collections = await this.invalidate(userId);
                }
                break;
        }
        return this.collections;
    }
    getCollectionsFromLocalDataSource(userId) {
        if (this.collections == null) {
            this.collections = ods_store_1.default.get(`${LibraryRepository.CACHE_FILE_PREFIX}${userId}`);
            this.collections = this.collections ?? [
                {
                    id: ces_parser_1.MY_BOOKS_CID,
                    title: ces_parser_1.MY_BOOKS_TITLE,
                    description: '',
                    eCommerceUrl: null,
                    thumbnailUrl: null,
                    productId: null,
                    books: [],
                    license: {
                        expired: false,
                        expiryDate: null,
                    }
                }
            ];
            this.collections.forEach(collection => {
                collection.books.forEach(book => {
                    book.isDownloaded = file_io_1.default.checkExistAndClose(`${path_utils_1.default.bookPath + book.id}.asar`);
                });
            });
        }
        return this.collections;
    }
    async getCollectionsFromRemoteDataSource() {
        try {
            const idToken = auth0_credential_1.default.idToken;
            const response = await library_service_1.default.getLibraryCollections(idToken);
            if (response?.body?.books) {
                return [
                    {
                        id: ces_parser_1.MY_BOOKS_CID,
                        title: ces_parser_1.MY_BOOKS_TITLE,
                        description: '',
                        eCommerceUrl: null,
                        thumbnailUrl: null,
                        productId: null,
                        books: await Promise.all(response.body?.books?.map(model_mapper_1.mapBook)),
                        license: {
                            expired: false,
                            expiryDate: null,
                        }
                    },
                    ...await Promise.all(response.body?.collections?.map(model_mapper_1.mapCollection)),
                ];
            }
            else {
                console.error('Invalid response while fetching library collections');
                console.dir(response);
            }
        }
        catch (e) {
            console.error('Error while fetching library collections: ', e.message);
            console.dir(e);
        }
    }
    /**
     *  Expected output:
     *  {
     *      "{assignmentGroupId}": ["{bid}", "{bid}", "{bid}"],
     *      "{assignmentGroupId}": ["{bid}", "{bid}", "{bid}"]
     *  }
     */
    getAssignmentGroupIds() {
        const groupAssignments = new Map();
        for (const collection of this.collections ?? []) {
            for (const book of collection.books ?? []) {
                for (const { assignmentGroupId } of book.assignment ?? []) {
                    if (assignmentGroupId) {
                        groupAssignments[assignmentGroupId] = groupAssignments[assignmentGroupId] || [];
                        if (groupAssignments[assignmentGroupId].includes(book.id) === false) {
                            groupAssignments[assignmentGroupId].push(book.id);
                        }
                    }
                }
            }
        }
        return groupAssignments;
    }
    getAssignmentGroupIdsForBook(bookId) {
        return this.collections.flatMap(collection => collection.books)
            .filter(book => book.id === bookId && book.assignment?.length > 0)
            .flatMap(book => book.assignment)
            .filter(assignment => assignment.assignmentGroupId)
            .map(assignment => assignment.assignmentGroupId);
    }
    markAsLatest(bookId) {
        this.collections.flatMap(collection => collection.books)
            .filter(book => book.id === bookId)
            .forEach(book => book.updateRequired = false);
    }
    updateDownloadStatus(bookId, downloaded) {
        this.collections.flatMap(collection => collection.books)
            .filter(book => book.id === bookId)
            .forEach(book => book.isDownloaded = downloaded);
    }
    getBook(bid, collectionId = undefined) {
        if (collectionId) {
            return this.collections.find(collection => collection.id === collectionId)
                ?.books.find(book => book.id === bid);
        }
        else {
            return this.collections.flatMap(collection => collection.books)
                .find(book => book.id === bid);
        }
    }
    static instance;
    static getInstance() {
        if (!LibraryRepository.instance) {
            LibraryRepository.instance = new LibraryRepository();
        }
        return LibraryRepository.instance;
    }
}
exports.default = LibraryRepository.getInstance();
module.exports = LibraryRepository.getInstance();
