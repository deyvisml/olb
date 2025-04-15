"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const autolinker_1 = __importDefault(require("autolinker"));
class HypertextUtils {
    static enableLinks(text, openFromBrowser = true) {
        const autoLinker = new autolinker_1.default();
        if (openFromBrowser) {
            const matched = autoLinker.parse(text);
            for (const match of matched) {
                const matchedText = match.getMatchedText();
                const url = matchedText.startsWith('http')
                    ? matchedText
                    : `https://${matchedText}`;
                text = text.replace(matchedText, `<a onClick="openBrowser('${url}');">${matchedText}</a>`);
            }
            return text;
        }
        else {
            return autoLinker.link(text);
        }
    }
}
exports.default = HypertextUtils;
module.exports = HypertextUtils;
