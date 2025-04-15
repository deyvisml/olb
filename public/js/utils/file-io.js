"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const graceful_fs_1 = __importDefault(require("graceful-fs"));
const path_1 = __importDefault(require("path"));
const hidefile_1 = __importDefault(require("hidefile"));
const FileIO = {
    IGNORES: ['.DS_Store'],
    exist(path) {
        let ret = false;
        try {
            ret = fs_1.default.existsSync(path);
        }
        catch (ignore) {
            // exception might occur if path is undefined.
        }
        return ret;
    },
    size(fd) {
        const stats = fs_1.default.fstatSync(fd);
        let size = 0;
        if (stats && stats.size > 0) {
            size = stats.size;
        }
        return size;
    },
    move(source, target) {
        try {
            graceful_fs_1.default.renameSync(source, target);
        }
        catch (ignore) {
            // exception might occur if source is not exist or target is already exist.
            console.dir(ignore);
        }
    },
    copy(source, target, callback) {
        try {
            if (callback && typeof callback === 'function') {
                fs_1.default.copyFile(source, target, (err) => {
                    callback(err);
                });
            }
            else {
                fs_1.default.copyFileSync(source, target);
            }
        }
        catch (ignore) {
            console.error(ignore);
        }
    },
    rename(source, target) {
        this.move(source, target);
    },
    chmod(path, mode, recursive = false) {
        if (this.exist(path) && mode) {
            if (this.isFile(path)) {
                this.chmodFile(path, mode);
            }
            else if (recursive) {
                const entries = this.scanDir(path);
                for (const entry of entries) {
                    const entryPath = path_1.default.join(path, entry);
                    if (this.isDirectory(entryPath)) {
                        this.chmod(entryPath, mode, recursive);
                    }
                    else {
                        this.chmodFile(entryPath, mode);
                    }
                }
            }
        }
    },
    chmodFile(path, mode) {
        try {
            const fd = fs_1.default.openSync(path, 'r');
            fs_1.default.fchmodSync(fd, mode);
            fs_1.default.closeSync(fd);
        }
        catch (ignore) {
            console.log('[FileIO] change mode failed: ', path);
            console.dir(ignore);
        }
    },
    checkExistAndClose(path) {
        let exist = false;
        try {
            const fd = fs_1.default.watch(path);
            if (fd !== undefined) {
                fd.close();
                exist = true;
            }
        }
        catch (exception) {
            exist = false;
        }
        return exist;
    },
    createDir(path, mode = undefined) {
        if (this.exist(path))
            return;
        try {
            fs_1.default.mkdirSync(path, {
                recursive: true,
                mode: mode,
            });
        }
        catch (ignore) {
            // exception might occur if path is already exist.
        }
    },
    removeDir(path) {
        if (this.exist(path)) {
            this.scanDir(path).forEach((file) => {
                const fullPath = path_1.default.join(path, file);
                if (this.isDirectory(fullPath) && !file.endsWith('.asar')) {
                    this.removeDir(fullPath);
                }
                else {
                    this.removeFile(fullPath);
                }
            });
            try {
                fs_1.default.rmdirSync(path);
            }
            catch (ignore) { }
        }
    },
    removeFile(path) {
        try {
            graceful_fs_1.default.unlinkSync(path);
        }
        catch (ignore) { }
    },
    hideDir(path) {
        try {
            hidefile_1.default.hideSync(path);
        }
        catch (e) {
            console.error(e);
        }
    },
    scanDir(dir) {
        return fs_1.default.readdirSync(dir);
    },
    writeFile(path, buffer) {
        fs_1.default.writeFileSync(path, buffer);
    },
    listFiles(dir, files = [], recursive = true) {
        const entries = fs_1.default.readdirSync(dir);
        for (const entry of entries) {
            if (recursive && this.isDirectory(`${dir}${entry}`)) {
                files.push(...this.listFiles(`${dir}${entry}/`, [], recursive));
            }
            else {
                if (this.IGNORES.includes(entry))
                    continue;
                files.push(`${dir}${entry}`);
            }
        }
        return files;
    },
    isEmpty(dir) {
        const exist = this.exist(dir);
        let empty = true;
        if (exist) {
            const files = fs_1.default.readdirSync(dir);
            if (files != null && files.length > 0) {
                for (const file of files) {
                    if (this.IGNORES.includes(file) === false) {
                        empty = false;
                        break;
                    }
                }
            }
        }
        return empty || !exist;
    },
    isFile(path) {
        // TODO : CALLING fs.lstatSync() FOR .ASAR FILE HOLDS THE FILE HANDLE FROM WINDOWS THIS IS NOT AN EXPECTED BEHAVIOUR.
        return fs_1.default.lstatSync(path).isFile();
    },
    isDirectory(path) {
        // TODO : CALLING fs.lstatSync() FOR .ASAR FILE HOLDS THE FILE HANDLE FROM WINDOWS THIS IS NOT AN EXPECTED BEHAVIOUR.
        return fs_1.default.lstatSync(path).isDirectory();
    },
    getWriteStream(path) {
        return graceful_fs_1.default.createWriteStream(path);
    },
    getExtension(path) {
        const segments = (path && path.split('.'));
        if (segments && segments.length > 0) {
            return segments.pop();
        }
        return null;
    },
};
exports.default = FileIO;
// CommonJS compatible export when the TypeScript migration complete, it can be removed.
module.exports = FileIO;
