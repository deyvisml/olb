"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const learning_record_service_1 = __importDefault(require("../../middleware/learning-record-service"));
const db_reading_diary_1 = __importDefault(require("../../database/db-reading-diary"));
const data_source_1 = require("./data-source");
/**
 *  Provide ReadingDiary Data
 */
class DiaryRepository {
    diary;
    clear() {
        this.diary = null;
    }
    async get(userId, source = data_source_1.DataSource.Local) {
        switch (source) {
            case data_source_1.DataSource.Remote:
                return this.getLatest(userId);
            case data_source_1.DataSource.Local:
            default:
                this.diary = await this.getCached(userId) ?? await this.getLatest(userId);
                return this.diary;
        }
    }
    async getCached(userId) {
        const entity = await db_reading_diary_1.default.find({ userId });
        if (entity?.data?.read_books_count >= 0) {
            return entity.data;
        }
        return null;
    }
    async getLatest(userId) {
        try {
            const response = await learning_record_service_1.default.getReadingStats();
            if (response?.body?.status?.code === 200 && response?.body?.results) {
                await db_reading_diary_1.default.upsert({ userId }, {
                    userId: userId,
                    data: response?.body?.results
                });
                this.diary = response?.body?.results;
            }
        }
        catch (ignore) {
            this.diary = await this.getCached(userId);
        }
        return this.diary;
    }
    async invalidate(userId) {
        try {
            this.diary = await this.getLatest(userId);
        }
        catch (ignore) { }
    }
    getEmptyDiaryData() {
        return {
            read_books_count: 0,
            read_words_count: 0,
            time_spent_reading: {
                hours: 0,
                minutes: 0,
                total_seconds: 0,
            },
            read_books: [],
            reading_books: []
        };
    }
    static instance;
    static getInstance() {
        if (!DiaryRepository.instance) {
            DiaryRepository.instance = new DiaryRepository();
        }
        return DiaryRepository.instance;
    }
}
exports.default = DiaryRepository.getInstance();
module.exports = DiaryRepository.getInstance();
