const path = require('path');
const asar = require('@electron/asar');

const PathUtils = require('../utils/path-utils');
const FileIO = require('../utils/file-io');

const BookSharer = {

    // movePublic() function moves the book & game files to the shared directory.
    movePublic() {
        PathUtils.createPublicFolders();

        FileIO.createDir(`${PathUtils.publicGamePath}engine`, 0o777);
        FileIO.createDir(`${PathUtils.publicGamePath}contents`, 0o777);

        // IF ODS LAUNCHES FOR FIRST TIME, AFTER OS USER CHANGED, THE PRIVATE PATH CAN NOT BE EXIST.
        if (FileIO.exist(PathUtils.privateBookPath)) {
            this.moveBooksToPublic();
        }
        if (FileIO.exist(PathUtils.privateGamePath)) {
            this.moveGameAssetsToPublic();
        }
    },

    moveBooksToPublic() {
        const books = FileIO.listFiles(PathUtils.privateBookPath, [], false);

        for (const book of books) {
            const dest = PathUtils.publicBookPath + path.basename(book);

            if (FileIO.exist(dest)) {
                this.truncateBookAsset(book);
            } else {
                // IF THE BOOK IS OPEN BEFORE IT IS REQUESTED TO BE MIGRATED, IT UNABLE TO ACQUIRE FILE HANDLE.
                if (book.endsWith('.asar')) {
                    this.migrateBookAsar(book, dest);  // 5,000ms for 200MB
                } else {
                    this.migrateEmbeddedWidgets(book, dest); // 32,000ms for 50 widgets
                }
            }
        }
    },

    truncateBookAsset(bookPath) {
        // .asar file can be treated as directory from Windows OS.
        if (bookPath.endsWith('.asar')) {
            FileIO.removeFile(bookPath);
        } else {
            FileIO.removeDir(bookPath);
        }
    },

    migrateBookAsar(book, dest) {
        const bid = path.basename(dest).replace('.asar', '');
        const extracted = PathUtils.privateBookPath + bid;

        asar.extractAll(book, extracted);
        asar.createPackage(extracted, `${dest}`).then(() => {
            FileIO.removeFile(book);
            FileIO.removeDir(extracted);
        });
    },

    migrateEmbeddedWidgets(src) {
        const entries = FileIO.listFiles(`${src}${path.sep}`, [], true);    // 1,000ms

        for (const entry of entries) {
            const dest = entry.replace(PathUtils.privateBookPath, PathUtils.publicBookPath);
            const folder = dest.replace(path.basename(dest), '');

            FileIO.createDir(folder);
            FileIO.copy(entry, dest, (err) => {
                if (err) return;

                FileIO.removeFile(entry);
            });
        }
    },

    moveGameAssetsToPublic() {
        const entries = FileIO.listFiles(`${PathUtils.privateGamePath}`, [], true);

        if (entries && entries.length > 0) {
            for (const entry of entries) {
                const dest = entry.replace(PathUtils.privateGamePath, PathUtils.publicGamePath);
                const folder = dest.replace(path.basename(dest), '');

                if (FileIO.exist(dest)) {
                    FileIO.removeFile(entry);
                } else {
                    FileIO.createDir(folder);
                    FileIO.copy(entry, dest, (err) => {
                        if (err) return;

                        FileIO.removeFile(entry);
                    });
                }
            }
        } else {
            this.truncatePrivateGameAssets();
        }
    },

    truncatePrivateGameAssets() {
        FileIO.removeDir(`${PathUtils.privateGamePath}engine`);
        FileIO.removeDir(`${PathUtils.privateGamePath}contents`);
    }

};

module.exports = BookSharer;