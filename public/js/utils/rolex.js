"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Rolex = {
    isExpired(timestamp) {
        return new Date().getTime() >= new Date(timestamp).getTime();
    },
    isGreater(first, second) {
        return new Date(first).getTime() > new Date(second).getTime();
    },
    getGreater(first, second) {
        return this.isGreater(first, second) ? first : second;
    },
};
exports.default = Rolex;
// CommonJS compatible export when the TypeScript migration complete, it can be removed.
module.exports = Rolex;
