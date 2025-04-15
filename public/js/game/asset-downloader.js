const path = require("path");
const gfs = require("graceful-fs");
const request = require("request");

const FileIO = require("../utils/file-io");
const PathUtils = require("../utils/path-utils");
const GameContentDB = require("../database/db-game-content");
const GameEngineDB = require("../database/db-game-engine");

const AssetDownloader = {

    async isLatestEngineDownloaded(engine) {
        const entity = await GameEngineDB.find({ engineId: engine.engine_id });

        return (entity?.engine?.version === engine.version && this.isEngineDownloaded(engine.engine_id));
    },

    async isLatestContentDownloaded(content) {
        const entity = await GameContentDB.find({ contentId: content.content_id });

        return (entity?.content?.version === content.version && this.isContentDownloaded(content.content_id));
    },

    isEngineDownloaded(engineId) {
        const dir = `${PathUtils.gameEnginePath}${engineId}`;
        const manifest = `${dir}${path.sep}engine_manifest.js`;
        const isDownloaded = FileIO.exist(dir) && FileIO.exist(manifest);
        const isExtracted = !FileIO.exist(`${dir}.zip`);

        return isDownloaded && isExtracted;
    },

    isContentDownloaded(contentId) {
        const dir = `${PathUtils.gameContentPath}${contentId}`;
        const index = `${dir}${path.sep}index.html`;
        const isDownloaded = FileIO.exist(dir) && FileIO.exist(index);
        const isExtracted = !FileIO.exist(`${dir}.zip`);

        return isDownloaded && isExtracted;
    },

    saveToFile(url, filepath) {
        if (FileIO.exist(filepath)) FileIO.removeFile(filepath);

        return new Promise((resolve) => {
            request({
                url: url,
                timeout: 10000,
            }).on('response', (response) => {
                if (response.statusCode !== 200) resolve(false);

                const stream = gfs.createWriteStream(filepath);
                const size = Number(response.headers['content-length']);

                stream.on('finish', () => {
                    resolve(size === stream.bytesWritten);
                });
                response.pipe(stream);
            }).on('error', () => {
                resolve(false);
            });
        });
    },
}

module.exports = AssetDownloader