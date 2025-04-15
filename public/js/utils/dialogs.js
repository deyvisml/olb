"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DialogType = void 0;
const electron_1 = require("electron");
var DialogType;
(function (DialogType) {
    DialogType["INFO"] = "info";
    DialogType["ERROR"] = "error";
    DialogType["QUESTION"] = "question";
    DialogType["WARNING"] = "warning";
})(DialogType || (exports.DialogType = DialogType = {}));
function showDialog({ title, message, browserWindow = electron_1.BrowserWindow.getFocusedWindow(), type = DialogType.INFO, buttons = ['OK'], }) {
    electron_1.dialog.showMessageBox(browserWindow, {
        type: type,
        buttons: buttons,
        title: title,
        message: message,
    }).then(() => {
    });
}
exports.default = showDialog;
module.exports = showDialog;
