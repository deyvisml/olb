"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const jquery_1 = __importDefault(require("jquery"));
const electron_1 = require("electron");
const ods_deeplink_1 = __importDefault(require("../ods-main/ods-deeplink"));
const download_status_1 = __importDefault(
  require("../ods-share/download-status")
);
const bookshelf_action_1 = __importDefault(require("./bookshelf-action"));
const bookshelf_search_1 = __importDefault(require("./bookshelf-search"));
const bookshelf_filter_1 = __importDefault(require("./bookshelf-filter"));
const bookshelf_pulldown_1 = __importDefault(require("./bookshelf-pulldown"));
const learn_more_1 = __importDefault(require("./view/learn-more"));
const collection_1 = __importDefault(require("./view/bookshelf/collection"));
const user = electron_1.ipcRenderer.sendSync("rdp-user");
const views = new Map();
const bookshelf = {
  escort() {
    if (electron_1.ipcRenderer.sendSync("rdp-should-escort-boarding")) {
      electron_1.ipcRenderer.send("view-dest-prepare-onboarding");
    } else if (electron_1.ipcRenderer.sendSync("rdp-should-escort-whatsnew")) {
      electron_1.ipcRenderer.send("view-dest-prepare-whatsnew");
    }
  },
  getDeeplinkAction() {
    return (
      electron_1.ipcRenderer.sendSync("rdp-deeplink") ||
      electron_1.ipcRenderer.sendSync("rdp-pending-deeplink")
    );
  },
  handleDeeplinkRequest() {
    const deeplink = this.getDeeplinkAction();
    if (deeplink == null || deeplink.type == null) return;
    switch (deeplink.type) {
      case ods_deeplink_1.default.TYPE.OPEN_BOOK:
        const book = electron_1.ipcRenderer.sendSync(
          "rdp-book",
          deeplink.param
        );
        if (book == null) {
          bookshelf_action_1.default.showBookNotFound();
        } else if (
          book.status === "EXPIRED" ||
          book.status === "ASSIGNED_WITHOUT_CODE"
        ) {
          bookshelf_action_1.default.showNoLicense(book, book.eCommerceUrl);
        } else if (book.isDownloaded) {
          bookshelf_action_1.default.openBook(deeplink.param, "My books");
        } else {
          (0, jquery_1.default)(
            `#book-data-${deeplink.param} .olb-book-cloud-info`
          ).click();
          document
            .getElementById(`book-data-${deeplink.param}`)
            .scrollIntoView();
          bookshelf_action_1.default.downloadBook(book);
        }
        break;
      case ods_deeplink_1.default.TYPE.EDIT_ACCOUNT_COMPLETE:
        electron_1.ipcRenderer.send("action-invalidate-user-details-request");
        break;
    }
  },
  clear() {
    (0, jquery_1.default)(".olb-book-wrap").not(".default").remove();
    (0, jquery_1.default)(".olb-book-collection.readers").remove();
  },
  render() {
    this.clear();
    const collections = electron_1.ipcRenderer.sendSync("rdp-collections");
    console.log("collections", collections);
    if (collections.length === 0 || collections[0].books.length === 0) {
      alert("Please connect to the internet and restart the app.");
      return;
    }
    for (const collection of collections) {
      const folded = collection_1.default.isFolded(user.id, collection.id);
      views[collection.id] = new collection_1.default(collection, folded);
      views[collection.id].attachedTo(
        (0, jquery_1.default)("#olb-book-content")
      );
      views[collection.id].bindEvents();
    }
    bookshelf_filter_1.default.filterBooks(views);
  },
  invalidate(collections) {
    if (collections?.length <= 0) return;
    for (const collection of collections) {
      if (views[collection.id]) {
        views[collection.id].invalidateBooks(collection);
      } else {
        views[collection.id] = new collection_1.default(collection, false);
        views[collection.id].attachedTo(
          (0, jquery_1.default)("#olb-book-content")
        );
        views[collection.id].bindEvents();
      }
    }
    bookshelf_filter_1.default.filterBooks(views);
  },
  bindEvents() {
    electron_1.ipcRenderer.on("view-dest-close-viewer", () => {
      electron_1.ipcRenderer.send("view-dest-bookshelf");
    });
    electron_1.ipcRenderer.on(
      "book-downloading",
      (event, bid, progress, status) => {
        const downloaded = download_status_1.default.COMPLETED === status;
        document.querySelectorAll(`#book-data-${bid}`).forEach((element) => {
          element.setAttribute("data-book-downloaded", downloaded.toString());
          element.setAttribute("data-book-downloadstatus", status);
        });
      }
    );
    electron_1.ipcRenderer.on(
      "book-download-failed",
      (event, bid, progress, status) => {
        document.querySelectorAll(`#book-data-${bid}`).forEach((element) => {
          element.setAttribute("data-book-downloaded", "false");
          element.setAttribute("data-book-downloadstatus", status);
        });
      }
    );
    electron_1.ipcRenderer.on("delete-book-response", (event, bid) => {
      document.querySelectorAll(`#book-data-${bid}`).forEach((element) => {
        element.setAttribute("data-book-downloaded", "false");
        element.setAttribute(
          "data-book-downloadstatus",
          download_status_1.default.CANDIDATE
        );
      });
    });
    electron_1.ipcRenderer.on("view-dest-open-onboarding", () => {
      (0, jquery_1.default)("#modal-window").load(
        "./modal/modal-boarding.html",
        () => {
          const firstName = user && user.firstName ? ` ${user.firstName}` : "";
          (0, jquery_1.default)("#welcomeHeader").html(
            `<h1>Welcome ${firstName}!</h1>`
          );
        }
      );
      // @ts-ignore
      (0, jquery_1.default)("#modal-window").modal();
    });
    electron_1.ipcRenderer.on("view-dest-open-whatsnew", () => {
      (0, jquery_1.default)("#modal-window").load(
        "./modal/modal-whats-new-bug-fix.html"
      );
      // @ts-ignore
      (0, jquery_1.default)("#modal-window").modal({
        backdrop: "static",
        keyboard: false,
      });
    });
    electron_1.ipcRenderer.on("view-dest-open-learn-more", () => {
      (0, jquery_1.default)("#modal-window").load(
        "./modal/modal-learn-more.html",
        () => {
          (0, jquery_1.default)("#learnMoreCarousel").html(
            learn_more_1.default.renderHTML()
          );
        }
      );
      // @ts-ignore
      (0, jquery_1.default)("#modal-window").modal();
    });
    electron_1.ipcRenderer.on(
      "view-bookshelf-invalidate",
      (event, collections) => {
        this.invalidate(collections);
      }
    );
    window.addEventListener("resize", () => {
      bookshelf_pulldown_1.default.close();
    });
    document
      .getElementById("bookshelf-nav-add-book")
      .addEventListener("click", () => {
        bookshelf_action_1.default.showAddBook();
      });
    document
      .getElementById("bookshelf-add-book")
      .addEventListener("click", () => {
        bookshelf_action_1.default.showAddBook();
      });
    document
      .getElementById("book-search")
      .addEventListener("submit", this.onSearchSubmitted);
    for (const option of document.querySelectorAll(
      ".bookshelf-filter-option"
    )) {
      option.addEventListener("click", (event) => {
        this.onFilterChanged(option, event);
      });
      // When the Enter and Space-key pressed, the filter option should be toggled.
      option.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          this.onFilterChanged(option, event);
        }
      });
    }
    (0, jquery_1.default)(".olb-book-content").off(
      "click",
      ".olb-book-device-info, .olb-book-cloud-info"
    );
    (0, jquery_1.default)(".olb-book-content").on(
      "click",
      ".olb-book-device-info, .olb-book-cloud-info",
      bookshelf_pulldown_1.default.toggle
    );
  },
  onSearchSubmitted(e) {
    e.stopPropagation();
    e.preventDefault();
    // @ts-ignore
    const keyword = document
      .getElementById("olb-search-keyword")
      .value.toLowerCase();
    if (keyword && keyword.length > 0) {
      bookshelf_search_1.default.submit(keyword);
    } else {
      bookshelf_search_1.default.clearPreviousSearchResult();
      bookshelf_filter_1.default.filterBooks(views);
    }
    bookshelf_pulldown_1.default.close();
  },
  onFilterChanged(option, e) {
    e.stopPropagation();
    e.preventDefault();
    const value = option.getAttribute("data-show") === "true";
    const filterName = option.getAttribute("data-name");
    bookshelf_pulldown_1.default.close();
    bookshelf_search_1.default.clearPreviousSearchResult();
    bookshelf_filter_1.default.onFilterChanged(filterName, !value);
    bookshelf_filter_1.default.filterBooks(views);
    // @ts-ignore
    document.getElementById("olb-search-keyword").value = null;
  },
  onFilterReset() {
    bookshelf_search_1.default.clearPreviousSearchResult();
    bookshelf_filter_1.default.filterBooks(views);
    // @ts-ignore
    document.getElementById("olb-search-keyword").value = null;
  },
  init() {
    setTimeout(() => {
      this.escort();
      this.render();
      this.bindEvents();
      // https://ipf-jira.atlassian.net/browse/OLBODS-286
      // When the deeplink handler executed right after it rendered.
      // The Book Panel is not properly opened from the Windows PC.
      setTimeout(() => this.handleDeeplinkRequest(), 480);
    }, 160);
  },
};
bookshelf.init();
exports.default = bookshelf;
module.exports = bookshelf;
