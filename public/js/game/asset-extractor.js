const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');

const FileIO = require("../utils/file-io");

const AssetExtractor = {

    async extract(zipFilePath, extractTo, removeAfterExtraction = false) {
        return new Promise((resolve, reject) => {
            FileIO.removeDir(extractTo);

            // noinspection JSCheckFunctionSignatures
            fs.createReadStream(zipFilePath)
                .pipe(unzipper.Parse())
                .on('entry', (entry) => {
                    if (entry.type === 'File') {
                        const outputPath = path.join(extractTo, entry.path);

                        FileIO.createDir(path.dirname(outputPath));

                        entry.pipe(fs.createWriteStream(outputPath));
                    }
                })
                .on('finish', () => {
                    if (removeAfterExtraction) FileIO.removeFile(zipFilePath);

                    resolve();
                })
                .on('error', reject);
        });
    },

    recoverWithBackup(dir) {
        FileIO.removeDir(dir);

        if (FileIO.exist(`${dir}_old`)) {
            FileIO.move(`${dir}_old`, dir);
        }
    },
}

module.exports = AssetExtractor