const path = require("path");
const { ipcRenderer } = require('electron');

// Provide Extended JavaScript Interface for RTA Viewer
window.rtaContentProvider = {

    getContent(filename) {
        const filepath = `resource${path.sep}${filename}`;

        return ipcRenderer.sendSync('rdp-read-text-file-from-asar', filepath);
    }
}