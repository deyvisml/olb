"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapBook = mapBook;
exports.mapAssignment = mapAssignment;
exports.mapCollection = mapCollection;
const file_io_1 = __importDefault(require("../../utils/file-io"));
const path_utils_1 = __importDefault(require("../../utils/path-utils"));
const db_book_1 = __importDefault(require("../../database/db-book"));
async function isUpdateRequired(book, downloaded) {
    if (!downloaded)
        return false;
    const entity = await db_book_1.default.find({ bid: book.id });
    return entity && Number(book.version) > Number(entity.version);
}
async function mapBook(book) {
    const downloaded = file_io_1.default.checkExistAndClose(`${path_utils_1.default.bookPath + book.id}.asar`);
    const updatedRequired = await isUpdateRequired(book, downloaded);
    return {
        id: book.id,
        title: book.title,
        series: book.series,
        category: book.category,
        author: book.author,
        description: book.description,
        thumbnailUrl: book.thumbnailUrl,
        isbn: book.isbn,
        wordCount: book.wordCount,
        startPage: book.startPage,
        endPage: book.endPage,
        type: book.type,
        version: book.version,
        publishDate: book.publishDate,
        size: book.size,
        status: book.status,
        eCommerceUrl: book.eCommerceUrl,
        downloadUrl: book.downloadUrl,
        zipDownloadUrl: book.zipDownloadUrl,
        cefrLevel: book.cefrLevel,
        productId: book.productId,
        updatedDate: book.updatedDate,
        teacherResourceId: book.teacherResourceId,
        accessible: book.accessible,
        readingDiary: book.readingDiary,
        license: book.license,
        assignment: book.assignment?.map(mapAssignment),
        // Self Managed Fields
        isDownloaded: downloaded,
        updateRequired: updatedRequired,
        thumbnailFilepath: path_utils_1.default.thumbPath + `${book.id}-${path_utils_1.default.getFilenameFromURL(book.thumbnailUrl)}`,
    };
}
function mapAssignment(assignment) {
    return {
        type: assignment.type,
        assignmentId: assignment.assignmentId,
        assignmentGroupId: assignment.assignmentGroupId,
        assignmentGroupName: assignment.assignmentGroupName,
        activationCode: assignment.activationCode,
    };
}
async function mapCollection(collection) {
    return {
        id: collection.id,
        title: collection.title,
        description: collection.description,
        eCommerceUrl: collection.eCommerceUrl,
        thumbnailUrl: collection.thumbnailUrl,
        productId: collection.productId,
        books: await Promise.all(collection.books?.map(mapBook)),
        license: collection.license,
    };
}
