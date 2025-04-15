"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const graceful_fs_1 = __importDefault(require("graceful-fs"));
const glob_1 = __importDefault(require("glob"));
const asar_1 = __importDefault(require("@electron/asar"));
const electron_1 = require("electron");
const path_utils_1 = __importDefault(require("../utils/path-utils"));
const zip_utils_1 = __importDefault(require("../utils/zip-utils"));
const file_io_1 = __importDefault(require("../utils/file-io"));
const content_cipher_1 = __importDefault(require("../utils/content-cipher"));
const asar_reader_1 = __importDefault(require("../utils/asar-reader"));
const ods_messages_1 = __importDefault(require("../ods-share/ods-messages"));
const download_status_1 = __importDefault(
  require("../ods-share/download-status")
);
const game_downloader_1 = __importDefault(require("../game/game-downloader"));
const game_remover_1 = __importDefault(require("../game/game-remover"));
const db_book_1 = __importDefault(require("../database/db-book"));
const library_repository_1 = __importDefault(
  require("../data/repository/library-repository")
);
const content_service_1 = __importDefault(
  require("../middleware/content-service")
);
const BookDownloader = {
  VALID_SUB_FOLDERS: [
    "answer",
    "buttons",
    "img",
    "info",
    "resource",
    "subtitle",
    "thumbnail",
  ],
  INVALID_FOLDER_LOOKUP: {
    uttons: "buttons",
    mg: "img",
    humbnail: "thumbnail",
    nfo: "info",
    nswer: "answer",
    esource: "resource",
    ubtitle: "subtitle",
  },
  STATUS: download_status_1.default,
  window: null,
  queue: [],
  init(window) {
    this.window = window;
    electron_1.ipcMain.on("download-book-start", this.start.bind(this));
    electron_1.ipcMain.on("download-book-pause", this.pause.bind(this));
    electron_1.ipcMain.on("download-book-resume", this.resume.bind(this));
    electron_1.ipcMain.on("download-book-cancel", this.cancel.bind(this));
    electron_1.ipcMain.on("delete-book-request", this.deleteBook.bind(this));
    electron_1.ipcMain.on("update-book-request", this.updateBook.bind(this));
    this.window.webContents.session.on("will-download", this.append.bind(this));
  },
  append(event, item) {
    const list = item.getURL().match(/([^/]+).zip/);
    if (list != null && list.length > 1) {
      const bid = list[1];
      let proxy;
      for (const fromQueue of this.queue) {
        if (fromQueue.bid === bid) {
          fromQueue.item = item;
          proxy = fromQueue.event;
          if (proxy.sender.isDestroyed() === false) {
            proxy.sender.send("book-downloading", bid, 0, this.STATUS.WAITING);
          }
        }
      }
      item.setSavePath(`${path_utils_1.default.bookPath + bid}.zip`);
      item.on("updated", (evt, state) => {
        this.inProgress(proxy, bid, item, state);
      });
      item.on("done", async (evt, state) => {
        await this.complete(proxy, bid, item, state);
      });
    }
  },
  async start(event, bookId, zip) {
    if (!this.onPrepareDownload(event, bookId)) return;
    event.sender.send("book-downloading", bookId, 0, this.STATUS.PRIOR_TASK);
    try {
      await game_downloader_1.default.downloadGameAssets(bookId);
      const response = await content_service_1.default.getSignedUrl(zip);
      console.log("-> Download URL:", response.body);
      this.window.webContents.downloadURL(response.body);
    } catch (e) {
      this.removeFromQueue(bookId);
      event.sender.send(
        "book-download-failed",
        bookId,
        0,
        this.STATUS.CANDIDATE
      );
    }
  },
  inProgress(event, bookId, item, state) {
    if (event == null) return; // @Reference: https://sentry.io/iportfolio-inc-1p/ods/issues/709736888
    if (state === this.STATUS.PROGRESSING) {
      if (!event.sender.isDestroyed()) {
        const status = item.isPaused()
          ? this.STATUS.PAUSED
          : this.STATUS.PROGRESSING;
        const progress = Math.ceil(
          (item.getReceivedBytes() / item.getTotalBytes()) * 100
        );
        event.sender.send("book-downloading", bookId, progress, status);
      }
    }
  },
  async complete(event, bookId, item, state) {
    if (state !== this.STATUS.COMPLETED) return;
    event.sender.send("book-downloading", bookId, 100, this.STATUS.EXTRACTING);
    await this.onPostDownload(event, bookId);
    this.removeFromQueue(bookId);
    library_repository_1.default.markAsLatest(bookId);
  },
  pause(event, bookId) {
    for (const book of this.queue) {
      if (book.bid === bookId && book.item !== undefined) {
        try {
          book.item.pause();
        } catch (e) {
          // Remark: 'Object has been destroyed' error can be occurred. Due to the timing issue.
        }
      }
    }
  },
  resume(event, bookId) {
    for (const book of this.queue) {
      if (book.bid === bookId && book.item !== undefined) {
        book.item.resume();
      }
    }
  },
  cancel(event, bookId) {
    for (const book of this.queue) {
      if (book.bid === bookId && book.item !== undefined) {
        book.item.cancel();
        fs_1.default.unlink(
          `${path_utils_1.default.bookPath + bookId}.zip`,
          () => {
            event.sender.send(
              "book-downloading",
              bookId,
              0,
              this.STATUS.CANCELED
            );
          }
        );
        this.queue.splice(this.queue.indexOf(book), 1);
        break;
      }
    }
  },
  async updateBook(event, bookId, zip) {
    asar_reader_1.default.clearAsarHeader(
      `${path_utils_1.default.bookPath + bookId}.asar`
    );
    file_io_1.default.removeFile(
      `${path_utils_1.default.bookPath + bookId}.asar`
    );
    file_io_1.default.removeDir(
      `${path_utils_1.default.bookPath + bookId}_WIDGET`
    );
    library_repository_1.default.updateDownloadStatus(bookId, false);
    await db_book_1.default.remove({ bookId });
    await this.start(event, bookId, zip);
  },
  async deleteBook(event, bookId) {
    try {
      file_io_1.default.removeFile(
        `${path_utils_1.default.bookPath + bookId}.asar`
      );
      file_io_1.default.removeDir(
        `${path_utils_1.default.bookPath + bookId}_WIDGET`
      );
      await game_remover_1.default.removeRelatedGameAssets(bookId);
      await db_book_1.default.remove({ bookId });
      library_repository_1.default.updateDownloadStatus(bookId, false);
      event.sender.send("delete-book-response", bookId);
    } catch (e) {
      await electron_1.dialog.showMessageBox({
        type: "info",
        buttons: ["OK"],
        title: "Cannot delete book",
        message: ods_messages_1.default.book_delete_failed_in_use,
      });
    }
  },
  existInQueue(bookId) {
    return this.queue.find((item) => item.bid === bookId) != null;
  },
  removeFromQueue(bookId) {
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i].bid === bookId) {
        this.queue.splice(i, 1);
        break;
      }
    }
  },
  onPrepareDownload(event, bookId) {
    if (this.existInQueue(bookId)) return false;
    this.queue.push({
      bid: bookId,
      event: event,
    });
    return true;
  },
  async onPostDownload(event, bookId) {
    const unzipDirectory = path_utils_1.default.bookPath + bookId;
    const zipFilepath = `${unzipDirectory}.zip`;
    try {
      await zip_utils_1.default.unzip(zipFilepath, unzipDirectory);
      this.sanitizeUnpackFolder(unzipDirectory);
      await this.extractWidgets(bookId, unzipDirectory);
      await this.createAsarFromZip(event, bookId, unzipDirectory);
      graceful_fs_1.default.unlinkSync(zipFilepath);
    } catch (ignore) {}
  },
  sanitizeUnpackFolder(unpackDir) {
    const files = file_io_1.default.scanDir(unpackDir);
    for (const file of files) {
      const path = `${unpackDir}/${file}`;
      if (
        file_io_1.default.isDirectory(path) &&
        !this.isValidSubFolder(file) &&
        this.getValidFolderNameForInvalidFolder(file)
      ) {
        file_io_1.default.rename(
          path,
          `${unpackDir}/${this.getValidFolderNameForInvalidFolder(file)}`
        );
      }
    }
  },
  isValidSubFolder(folderName) {
    return this.VALID_SUB_FOLDERS.includes(folderName);
  },
  getValidFolderNameForInvalidFolder(folderName) {
    return this.INVALID_FOLDER_LOOKUP[folderName];
  },
  async createAsarFromZip(event, bookId, unpackDir) {
    await content_cipher_1.default.encryptContent(`${unpackDir}/`, bookId);
    await asar_1.default.createPackage(unpackDir, `${unpackDir}.dat`);
    file_io_1.default.rename(`${unpackDir}.dat`, `${unpackDir}.asar`);
    file_io_1.default.removeDir(unpackDir);
    this.invalidateDownloadStatus();
    this.insertDatabase(bookId, unpackDir);
    if (event.sender.isDestroyed()) return;
    event.sender.send("book-downloading", bookId, 100, this.STATUS.COMPLETED);
  },
  async extractWidgets(bookId, filepath) {
    const widgets = glob_1.default.sync(`${filepath}/**/*.zip`);
    for (const widget of widgets) {
      const dir = widget.slice(0, -4).replace(bookId, `${bookId}_WIDGET`);
      await zip_utils_1.default.unzip(widget, dir);
    }
  },
  invalidateDownloadStatus() {
    const collections = library_repository_1.default.getCachedCollections();
    if (collections == null || collections.length === 0) return;
    for (const collection of collections) {
      if (collection.books == null || collection.books.length === 0) continue;
      for (const book of collection.books) {
        book.isDownloaded = file_io_1.default.checkExistAndClose(
          `${path_utils_1.default.bookPath}${book.id}.asar`
        );
      }
    }
  },
  insertDatabase(bookId, filepath) {
    try {
      const book = library_repository_1.default.getBook(bookId);
      if (book) {
        db_book_1.default.upsert(
          { bid: bookId },
          {
            bid: bookId,
            title: book.title,
            version: book.version,
            path: filepath,
          }
        );
      }
    } catch (e) {
      console.error(e);
    }
  },
};
module.exports = BookDownloader;
