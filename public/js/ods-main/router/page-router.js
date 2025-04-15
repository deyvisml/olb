const path = require("path");
const { shell, dialog, ipcMain, BrowserWindow, session } = require("electron");

const EnvConfig = require("../../config/env-config");

const menu = require("../../application/ods-menu");

const NetworkUtils = require("../../utils/network-utils");

const CesAuthService = require("../ces/ces-auth-service");

const protocol = require("../ods-protocol");
const GameUpdater = require("../../game/game-updater");

const Auth0 = require("../auth0/auth0");
const Auth0Controller = require("../auth0/auth0-controller");
const CesSigninWindow = require("../ces/ces-signin");
const CesRegisterWindow = require("../ces/ces-register");

const FileIO = require("../../utils/file-io");
const UserRepository = require("../../data/repository/user-repository");
const LibraryRepository = require("../../data/repository/library-repository");
const DiaryRepository = require("../../data/repository/diary-repository");
const ODStore = require("../ods-store");
const AuthProvider = require("../../middleware/auth-provider");
const downloadFile = require("../../utils/file-downloader");
const Auth0Credential = require("../auth0/auth0-credential");

const PageRouter = {
  register(window, __dirname) {
    this.window = window;
    this.root = __dirname;

    this.bindAuthEvents();
    this.bindPageChangeEvents();
    this.bindBookshelfEvents();

    this.start();
  },

  async start() {
    const user = await UserRepository.get();

    if (user && Auth0Credential.hasValidCredentials()) {
      await this.pageRouteBookshelf();
    } else {
      this.pageRouteLanding();
    }
  },

  bindAuthEvents() {
    ipcMain.on(
      "auth-auth0-sign-with-connection",
      async (event, deeplinkConnection) => {
        const signinUrl = Auth0.URL.buildSigninUrlWithConnection({
          hostname: EnvConfig.get(EnvConfig.Auth0Config.AUTH0_IDP_URL),
          clientId: EnvConfig.get(EnvConfig.Auth0Config.INTEGRATION_CLIENT_ID),
          redirectUrl: Auth0.URL.redirectUrlForDeeplink(),
          connection: deeplinkConnection,
          audience: EnvConfig.get(EnvConfig.Auth0Config.AUTH0_AUDIENCE),
          register: false,
        });

        shell.openExternal(signinUrl);
      }
    );

    ipcMain.on(
      "auth-auth0-signin-complete",
      async (event, authorizationCode) => {
        // Sign in process has been completed and authorizationCode forwarded from MS/Google SSO Page.
        await Auth0Controller.onAuthorizationCodeArrived({
          event: event,
          authorizationCode: authorizationCode,
          redirectionUrl: Auth0.URL.redirectUrlForDeeplink(),
        });
      }
    );

    ipcMain.on(
      "auth-signin-complete",
      async (event, authorizationCode, codeVerifier) => {
        await Auth0Controller.onAuthorizationCodeArrived({
          event: event,
          authorizationCode: authorizationCode,
          redirectionUrl: EnvConfig.get(EnvConfig.OLBConfig.OLB_BOOKSHELF),
          codeVerifier: codeVerifier,
        });
      }
    );

    ipcMain.on("auth-partial-register-complete", async (event) => {
      const user = await UserRepository.get();

      user.legacy = false;
      user.partial = false;

      event.sender.send("auth-signin-post-signin", user);
    });

    ipcMain.on("auth-signout", this.pageRouteSignout.bind(this));

    ipcMain.on(
      "auth-google-signin-via-default-browser",
      (event, connection, register) => {
        const signinUrl = Auth0.URL.buildSigninUrlWithConnection({
          hostname: EnvConfig.get(EnvConfig.Auth0Config.AUTH0_IDP_URL),
          clientId: EnvConfig.get(EnvConfig.Auth0Config.INTEGRATION_CLIENT_ID),
          redirectUrl: Auth0.URL.redirectUrlForDeeplink(),
          connection: connection,
          audience: EnvConfig.get(EnvConfig.Auth0Config.AUTH0_AUDIENCE),
          register: register,
        });

        shell.openExternal(signinUrl);

        CesRegisterWindow.close();
        CesSigninWindow.close();
      }
    );

    ipcMain.on("reload-signin-page-request-from-ces", (event) => {
      CesRegisterWindow.close();
      CesSigninWindow.close();

      CesSigninWindow.open(this.window);
    });
  },

  bindPageChangeEvents() {
    ipcMain.on("view-dest-open-help", this.pageRouteHelp.bind(this));

    ipcMain.on("view-dest-open-idp", this.pageRouteSignin.bind(this));

    ipcMain.on("view-dest-ces-register", this.pageRouteCesRegister.bind(this));

    ipcMain.on("view-dest-bookshelf", this.pageRouteBookshelf.bind(this));

    ipcMain.on(
      "view-dest-reading-diary",
      this.pageRouteReadingDiary.bind(this)
    );

    ipcMain.on("view-dest-certificate", this.pageRouteCertificate.bind(this));

    ipcMain.on("view-dest-prepare-whatsnew", this.pageRouteWhatsNew.bind(this));

    ipcMain.on(
      "view-dest-prepare-onboarding",
      this.pageRouteBoarding.bind(this)
    );

    ipcMain.on(
      "view-dest-prepare-learn-more",
      this.pageRouteLearnMore.bind(this)
    );
  },

  bindBookshelfEvents() {
    ipcMain.on(
      "view-bookshelf-open-book",
      async (event, bid, collectionTitle) => {
        try {
          menu.startReading();

          const user = await UserRepository.get();
          const book = LibraryRepository.getBook(bid);

          // Remark: Check the downloaded asar for book is still exist.
          protocol.checkoutBookDataAvailable(bid);

          global["action-open-book"] = {
            environment: EnvConfig.Env,
            bid: bid,
            isCPT: book.type.classroomPresentation,
            CEFR: book.cefrLevel,
            category: book.category,
            readingDiary: book.type.readers,
            collectionTitle: collectionTitle,
            organizationIds: user.getOrganizationIds(),
            assignmentGroupIds:
              LibraryRepository.getAssignmentGroupIdsForBook(bid),
          };
          this.window.loadURL(`file://${this.root}/html/viewer.html`);
        } catch (e) {
          dialog.showMessageBox({
            type: "info",
            buttons: ["OK"],
            title: "The downloaded book seems to be corrupted",
            message:
              "The downloaded book seems to be corrupted. Could you delete the book and re-download again?",
          });
        }
      }
    );

    ipcMain.on("view-bookshelf-game-update-start", () => {
      GameUpdater.updateOutdatedAssets(this.window).then(() => {});
    });
  },

  pageRouteHelp(event, target) {
    const parentSize = this.window.getSize();
    const child = new BrowserWindow({
      parent: this.window,
      modal: false,
      show: false,
      resizable: true,
      autoHideMenuBar: true,
      y: Math.max(0, (parentSize[1] - 750) / 2),
      width: 830,
      height: 750,
    });

    if (target == null) {
      target = "home.htm";
    }
    child.loadURL(
      `file://${this.root}/html/help/en-GB/HelpFiles/index.htm?${target}`
    );
    child.once("ready-to-show", () => {
      child.show();
    });
  },

  pageRouteLanding() {
    menu.logout();

    this.window.loadURL(`file://${this.root}/html/landing.html`);
  },

  pageRouteSignin() {
    if (this.window.getChildWindows().length > 0) return;

    CesSigninWindow.open(this.window);
  },

  pageRouteCesRegister() {
    if (this.window.getChildWindows().length > 0) return;

    CesRegisterWindow.open(this.window);
  },

  pageRouteSignout() {
    session.defaultSession
      .clearStorageData({
        storages: ["cookies", "cachestorage"],
      })
      .then(() => {});

    menu.landing();

    CesAuthService.API.signout({
      clientId: EnvConfig.get(EnvConfig.Auth0Config.INTEGRATION_CLIENT_ID),
      redirectUri: EnvConfig.get(EnvConfig.OLBConfig.OLB_BOOKSHELF),
    }).then(() => {});

    UserRepository.clear();
    LibraryRepository.clear();
    DiaryRepository.clear();
    Auth0Credential.clear();
    AuthProvider.revokeTokens();

    global.user = {};

    this.pageRouteLanding();
  },

  async pageRouteBookshelf() {
    menu.stopReading();

    this.window.loadURL(`file://${this.root}/html/bookshelf.html`);

    // ODS asynchronously invalidates the loaded collections and books via CES API.
    setTimeout(async () => {
      if (NetworkUtils.isOnline()) {
        menu.bookshelf(global.user);

        const collections = await LibraryRepository.invalidate(global.user.id);

        this.window.webContents.send("view-bookshelf-invalidate", collections);

        await UserRepository.invalidate(global.user.id);

        // Download thumbnail images for books that do not have them.
        if (NetworkUtils.isOnline()) {
          collections
            .flatMap((collection) => collection.books)
            .filter((book) => !FileIO.exist(book.thumbnailFilepath))
            .forEach((book) =>
              downloadFile(book.thumbnailUrl, book.thumbnailFilepath)
            );
        }
      }
    }, 720); // Delay 1000ms to receive network-status initialize.
  },

  async pageRouteReadingDiary() {
    menu.stopReading();

    this.window.loadURL(`file://${this.root}/html/reading-diary.html`);

    DiaryRepository.invalidate(global.user.id);
  },

  pageRouteCertificate() {
    menu.stopReading();

    this.window.loadURL(`file://${this.root}/html/certificate.html`);
  },

  async pageRouteWhatsNew(event) {
    const modalKey = `${global.user.id}-${global.application.version}`;

    ODStore.set(`modal-unrevealed-${modalKey}`, false);

    event.sender.send("view-dest-open-whatsnew");
  },

  async pageRouteBoarding(event) {
    const modalKey = `${global.user.id}-boarding`;

    ODStore.set(`modal-unrevealed-${modalKey}`, false);

    event.sender.send("view-dest-open-onboarding");
  },

  pageRouteLearnMore(event) {
    event.sender.send("view-dest-open-learn-more");
  },
};

module.exports = PageRouter;
