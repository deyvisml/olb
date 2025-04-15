"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const extract_zip_1 = __importDefault(require("extract-zip"));
const zipUtils = {
    async unzip(zipFilePath, dest, onEntry = null) {
        return (0, extract_zip_1.default)(zipFilePath, {
            dir: dest,
            onEntry: onEntry,
        });
    }
};
exports.default = zipUtils;
// CommonJS compatible export when the TypeScript migration complete, it can be removed.
module.exports = zipUtils;
