const path = require('path');
const { BrowserWindow } = require('electron');

const PathUtils = require('../utils/path-utils');

const GameRuntime = {

    GAME_VIEW_SIZE: {
        WIDTH: 1024,
        HEIGHT: 768
    },

    getPosition(parentWindow) {
        const parentWidth = parentWindow.getSize()[0];
        const parentHeight = parentWindow.getSize()[1];

        return {
            x: (parentWindow.x + Math.max(0, (parentWidth - this.GAME_VIEW_SIZE.WIDTH) / 2)),
            y: (parentWindow.y + Math.max(0, (parentHeight - this.GAME_VIEW_SIZE.HEIGHT) / 2)),
        };
    },

    launch(window, gameName) {
        const { x, y } = this.getPosition(window);

        const gameWindow = new BrowserWindow({
            width: this.GAME_VIEW_SIZE.WIDTH,
            height: this.GAME_VIEW_SIZE.HEIGHT,
            x: x,
            y: y,

            parent: window,
            modal: false,
            show: false,
            resizable: false,
            autoHideMenuBar: true,
            webPreferences: {
                allowRunningInsecureContent: true,
                webSecurity: false,
                nodeIntegration: false,
                contextIsolation: false,
                javascript: true,
                preload: `${PathUtils.appPath}/public/engine_loader/engine_loader.js`,
            }
        });

        gameWindow.loadURL(`file://${PathUtils.gameContentPath}${gameName}${path.sep}index.html`);
        gameWindow.once('ready-to-show', () => {
            gameWindow.show();
        });

        this.injectEngineLoader(gameWindow);
    },

    injectEngineLoader(window) {
        const engineBaseUrl = PathUtils.gameEnginePath.replace(/\\/g, '\\\\\\\\');

        // https://github.com/electron/electron/issues/23722#issuecomment-632631774
        // Add ;0 to the end of the original script,
        // otherwise the resulting value is attempted to be cloned and used as a result of executeJavaScript.
        window.webContents.executeJavaScript(`engineLoader.setBaseURL("${engineBaseUrl}");0`);
    },
}

module.exports = {
    launch: GameRuntime.launch.bind(GameRuntime),
};