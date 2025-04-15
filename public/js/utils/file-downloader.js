"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const request_1 = __importDefault(require("request"));
const file_io_1 = __importDefault(require("./file-io"));
function downloadFile(url, filepath) {
    if (url == null || filepath == null)
        return;
    try {
        (0, request_1.default)({
            url: url,
            timeout: 30000,
        }).on('response', (res) => {
            if (res && res.statusCode === 200) {
                const temporaryPath = `${filepath}.tmp`;
                const stream = res.pipe(file_io_1.default.getWriteStream(temporaryPath));
                stream.on('finish', () => {
                    if (file_io_1.default.exist(temporaryPath)) {
                        file_io_1.default.rename(temporaryPath, filepath);
                    }
                });
            }
        });
    }
    catch (e) {
        console.error(e);
    }
}
exports.default = downloadFile;
module.exports = downloadFile;
