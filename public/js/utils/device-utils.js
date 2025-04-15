"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = __importDefault(require("os"));
const node_machine_id_1 = require("node-machine-id");
const DeviceUtils = {
    TARGET_MAC: 1,
    TARGET_WIN: 2,
    TARGET_LINUX: 3,
    getMachineId() {
        return (0, node_machine_id_1.machineIdSync)();
    },
    getOS() {
        switch (os_1.default.platform()) {
            case 'darwin':
                return this.TARGET_MAC;
            case 'linux':
                return this.TARGET_LINUX;
            default:
                return this.TARGET_WIN;
        }
    },
    getCPUClock() {
        const cpus = os_1.default.cpus();
        let clock = 0;
        for (const cpu of cpus) {
            clock += cpu.speed;
        }
        return clock;
    },
    getMemorySize() {
        return os_1.default.totalmem();
    },
};
exports.default = DeviceUtils;
// CommonJS compatible export when the TypeScript migration complete, it can be removed.
module.exports = DeviceUtils;
