"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = __importDefault(require("os"));
const crypto_1 = __importDefault(require("crypto"));
const nedb_1 = __importDefault(require("nedb"));
const path_utils_1 = __importDefault(require("../utils/path-utils"));
const algorithm = 'aes-256-cbc'; // or any other algorithm supported by OpenSSL
const osname = os_1.default.userInfo().username;
class AbsDatabase {
    get DATABASE_NAME() {
        throw new Error('Database name must be declared in Subclass');
    }
    dataStore;
    constructor() {
        this.dataStore = this.getDatastore(path_utils_1.default.dataPath + this.DATABASE_NAME);
    }
    getDatastore(filename) {
        return new nedb_1.default({
            filename: filename,
            autoload: true,
            afterSerialization: (plainText) => {
                return this.encryptData(plainText);
            },
            beforeDeserialization: (cipherText) => {
                let plaintext;
                if (cipherText && cipherText.length > 0) {
                    try {
                        plaintext = this.decryptData(cipherText);
                        plaintext = JSON.parse(plaintext);
                    }
                    catch (ignore) { }
                }
                return plaintext;
            },
            // For some reason, data can be corrupted.
            // When the saved data is corrupted, decryption and JSON.parse() can be failed.
            corruptAlertThreshold: 10,
        });
    }
    getKeyAndIv(osname) {
        const hash = crypto_1.default.createHash('sha256')
            .update(osname)
            .digest();
        const key = hash.toString('hex').substring(0, 32);
        const iv = key.substring(0, 16);
        return { key, iv };
    }
    encryptData(data) {
        const { key, iv } = this.getKeyAndIv(osname);
        const cipher = crypto_1.default.createCipheriv(algorithm, key, iv);
        const serializedData = JSON.stringify(data);
        return cipher.update(serializedData, 'utf8', 'hex') + cipher.final('hex');
    }
    decryptData(data) {
        try {
            const { key, iv } = this.getKeyAndIv(osname);
            const decipher = crypto_1.default.createDecipheriv(algorithm, key, iv);
            return decipher.update(data, 'hex', 'utf8') + decipher.final('utf8');
        }
        catch (e) {
            // For Backward compatibility. If the doc is encrypted from the previous version.
            // It is decrypted with previous encryption method and key.
            // noinspection JSDeprecatedSymbols
            const decipher = crypto_1.default.createDecipher(algorithm, osname);
            return decipher.update(data, 'hex', 'utf8') + decipher.final('utf8');
        }
    }
    aggregate(query) {
        return new Promise((resolve) => {
            this.dataStore.find(query, (_, documents) => {
                resolve(documents);
            });
        });
    }
    find(query) {
        return new Promise((resolve) => {
            this.dataStore.findOne(query, (_, document) => {
                resolve(document);
            });
        });
    }
    insert(document) {
        return new Promise((resolve) => {
            this.dataStore.insert(document, (_, document) => {
                resolve(document);
            });
        });
    }
    upsert(query, document) {
        return new Promise((resolve) => {
            this.dataStore.update(query, document, { upsert: true }, (_, numberOfUpdated) => {
                resolve(numberOfUpdated);
            });
        });
    }
    remove(query, option = null) {
        return new Promise((resolve) => {
            this.dataStore.remove(query, (option || {}), (_, numberOfRemoved) => {
                resolve(numberOfRemoved);
            });
        });
    }
}
exports.default = AbsDatabase;
