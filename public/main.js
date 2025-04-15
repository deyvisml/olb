const path = require("path");

const { machineIdSync } = require("node-machine-id");

const {
  app,
  dialog,
  protocol,
  globalShortcut,
  systemPreferences,
  BrowserWindow,
} = require("electron");
const remoteElectron = require("@electron/remote/main");
const unhandled = require("electron-unhandled");

const EnvConfig = require("./js/config/env-config");

const DeviceUtils = require("./js/utils/device-utils");
const DeviceSettings = require("./js/utils/device-setting");
const NetworkUtils = require("./js/utils/network-utils");

const menu = require("./js/application/ods-menu");
const updater = require("./js/application/update");
const messages = require("./js/ods-share/ods-messages");
const odsProtocol = require("./js/ods-main/ods-protocol");

const pageRouter = require("./js/ods-main/router/page-router");
const actionRouter = require("./js/ods-main/router/action-router");
const eventRouter = require("./js/ods-main/router/event-router");

const Deeplink = require("./js/ods-main/ods-deeplink");
const BookSharer = require("./js/ods-main/ods-book-sharer");
const RemoteDataProvider = require("./js/data/remote-data-provider");
const CESPreprocessor = require("./js/ods-main/ces/ces-preprocessor");
const BookDownloader = require("./js/ods-main/ods-downloader");
const ViewerDock = require("./js/ods-share/viewer-dock");
const FileIO = require("./js/utils/file-io");
const PathUtils = require("./js/utils/path-utils");
const showDialog = require("./js/utils/dialogs");

class ODSApplication {
  static get REQUIREMENT() {
    return {
      MEMORY: 954 * 1024 * 1024,
      CPU: 2048,
    };
  }

  get MIN_WINDOW_WIDTH() {
    return 1024;
  }
  get MIN_WINDOW_HEIGHT() {
    return 768;
  }

  get MAIN_WINDOW_CONSTRUCTOR_OPTION() {
    return {
      minWidth: this.MIN_WINDOW_WIDTH,
      minHeight: this.MIN_WINDOW_HEIGHT,
      maximizable: true,
      icon: path.join(__dirname, "/images/icons/png/128x128.png"),
      scrollBounce: true,
      show: false,
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true,
        contextIsolation: false,
      },
    };
  }

  constructor() {
    this.initGlobals();
    this.disableDefaultActions();

    protocol.registerSchemesAsPrivileged([
      {
        scheme: "ods-viewer",
        privileges: {
          stream: true,
          supportFetchAPI: true,
        },
      },
    ]);

    app.on("ready", () => {
      if (this.checkRequirement()) {
        this.launch();
      } else {
        dialog.showErrorBox(
          "System Requirements",
          messages.system_requirement_insufficient
        );
        app.quit();
      }
    });

    app.on("window-all-closed", () => {
      // On OS X it is common for applications and their menu bar
      // to stay active until the user quits explicitly with Cmd + Q
      if (global.spawnedProcess) {
        global.spawnedProcess.kill();
      }
      app.quit();
    });

    app.on("activate", () => {
      // OS X it's default to re-create a window in the app
      // Avoid re-launch, while the previous runtime is live.
      if (this.window) return;

      this.launch();
    });

    // https://www.electronjs.org/docs/api/app#event-open-url-macos
    // Called when browser navigated to olb://deeplink/{bid} while ODS-Mac is open.
    app.on("open-url", (event, url) => {
      if (event) event.preventDefault();

      if (this.window && this.window.isMinimized()) {
        this.window.restore();
      }
      Deeplink.onOpenURL(url);
    });

    if (app.requestSingleInstanceLock() === false) {
      app.quit();
    }

    app.on("second-instance", (event, argv) => {
      // Someone tried to run a second instance, we should focus our window.
      // Protocol handler for win32
      if (this.window) {
        if (this.window.isMinimized()) {
          this.window.restore();
        }
        this.window.focus();
      }

      // Called when browser navigated to olb://deeplink/{bid} while ODS-Win is open.
      Deeplink.onOpenURL(Deeplink.getParamFromArgs(argv));
    });
  }

  launch() {
    this.launched = false;

    this.launchSplashWindow();
  }

  launchSplashWindow() {
    this.splashWindow = new BrowserWindow({
      ...this.MAIN_WINDOW_CONSTRUCTOR_OPTION,
      show: true,
      alwaysOnTop: true,
    });

    this.splashWindow.once("ready-to-show", () => {
      this.launchMainWindow();
    });
    this.splashWindow.maximize();
    console.log("->", `file://${__dirname}/html/splash.html`);
    this.splashWindow.loadURL(`file://${__dirname}/html/splash.html`);
  }

  launchMainWindow() {
    this.window = new BrowserWindow(this.MAIN_WINDOW_CONSTRUCTOR_OPTION);
    this.window.webContents.on("did-finish-load", () => {
      if (this.launched) return;

      this.launched = true;

      if (DeviceUtils.getOS() !== DeviceUtils.TARGET_MAC) {
        this.window.maximize();
      }
      this.window.show();
      this.splashWindow.close();
    });

    if (DeviceUtils.getOS() === DeviceUtils.TARGET_MAC) {
      /**
       *  Sets the handler which can be used to respond to permission checks for the session.
       *  Returning true will allow the permission and false will reject it.
       */
      this.window.webContents.session.setPermissionCheckHandler(() => {
        return true;
      });

      /**
       *  Sets the handler which can be used to respond to permission requests for the session.
       *  Calling callback(true) will allow the permission and callback(false) will reject it.
       */
      this.window.webContents.session.setPermissionRequestHandler(
        async (_webContents, permission, callback) => {
          if (permission === "media") {
            const result = await systemPreferences.askForMediaAccess(
              "microphone"
            );

            if (result === false) {
              showDialog({
                title: "Microphone Access Required",
                message:
                  "Microphone access is required to record audio notes. Please allow the access from the system settings.",
                buttons: ["OK"],
              });
            }
            callback(result);
          } else {
            callback(true);
          }
        }
      );
    }

    this.window.on("close", (event) => {
      event.preventDefault();

      FileIO.removeDir(`${PathUtils.bookPath}.tmp/`);

      // Do last wishes. WebViewer sync the user-data.
      this.window.send("closeApplication");
    });

    if (DeviceUtils.getOS() === DeviceUtils.TARGET_MAC) {
      this.window.maximize(); // Maximize in hidden state makes blink in Linux.
    }
    if (global.application.debug) {
      this.window.webContents.openDevTools();
    }

    this.bindDeeplinkArgs();
    this.registerShortcut();
    this.registerCustomProtocols();

    if (DeviceSettings.get("share-content", false)) {
      BookSharer.movePublic(); // Migrate the downloaded books to the public folder, only if the share-content option is enabled.
    }

    this.onStarted();
  }

  onStarted() {
    /**
     *  https://www.npmjs.com/package/@electron/remote#migrating-from-remote
     */
    remoteElectron.initialize();
    remoteElectron.enable(this.window.webContents);

    pageRouter.register(this.window, __dirname);
    eventRouter.register(this.window);
    actionRouter.register();

    menu.init(this.window);
    updater.checkLatest();

    RemoteDataProvider.init();
    BookDownloader.init(this.window);
    ViewerDock.init(this.window);

    if (NetworkUtils.isOnline()) {
      CESPreprocessor.prepare(CESPreprocessor.RESERVED.COGNITO_CREDENTIAL);
      CESPreprocessor.prepare(
        CESPreprocessor.RESERVED.CES_COMMON_VARIABLE,
        true
      );
      CESPreprocessor.prepare(
        CESPreprocessor.RESERVED.CES_COMMON_CONTENT,
        true
      );

      EnvConfig.invalidateConfig();
    }
  }

  checkRequirement() {
    // DeviceUtils.getCPUClock() returns 0 due to the electron bug.
    // https://github.com/microsoft/vscode/issues/112122.
    // When ODS upgrades electron 12 or above, then it should re-enable below condition.
    return (
      /* DeviceUtils.getCPUClock() > ODSApplication.REQUIREMENT.CPU && */ DeviceUtils.getMemorySize() >
      ODSApplication.REQUIREMENT.MEMORY
    );
  }

  initGlobals() {
    global.device = {
      id: machineIdSync(true),
      online: true,
    };
    global.application = {
      env: EnvConfig.Env,
      version: app.getVersion(),
      debug: /--debug/.test(process.argv[2]),
    };
    global.user = {
      legacy: false,
      partial: false,
    };
    global["action-deeplink"] = null;
    global["action-pending-deeplink"] = null;
    global["action-open-book"] = null;
  }

  bindDeeplinkArgs() {
    if (process.platform === "win32") {
      // Keep only command line / deep linked arguments
      if (process.argv[1]) {
        Deeplink.setParams(process.argv[1]);
      }
    }
  }

  registerCustomProtocols() {
    // @Reference: https://electronjs.org/docs/api/app#appsetasdefaultprotocolclientprotocol-path-args
    app.setAsDefaultProtocolClient("olb"); // Register Protocol for Deeplink.

    odsProtocol.registerODS();
  }

  registerShortcut() {
    globalShortcut.register("CommandOrControl+Shift+D", () => {
      this.window.webContents.openDevTools();
    });
  }

  disableDefaultActions() {
    // Remarks: Avoid System Error Messages is being displayed to user.
    // noinspection JSUndefinedPropertyAssignment
    dialog.showErrorBox = (title, content) => {
      console.log("showErrorBox: ", title);
      console.dir(content);
    };
  }
}

unhandled({
  logger: (error) => {
    console.error(error);
  },
  showDialog: false,
});

module.exports = new ODSApplication();
