"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_store_1 = __importDefault(require("electron-store"));
const cacheStorage = new electron_store_1.default();
const storage = {
    env: null,
    setEnvTag(env) {
        this.env = env;
    },
    envTaggedKey(key) {
        return `${this.env}-${key}`;
    },
    has(key) {
        return cacheStorage.has(this.envTaggedKey(key));
    },
    get(key, defaultValue = null) {
        return cacheStorage.get(this.envTaggedKey(key), defaultValue);
    },
    set(key, value) {
        cacheStorage.set(this.envTaggedKey(key), value);
    },
    delete(key) {
        cacheStorage.delete(this.envTaggedKey(key));
    },
};
exports.default = storage;
module.exports = storage;
