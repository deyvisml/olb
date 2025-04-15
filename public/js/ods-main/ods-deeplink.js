const pageRouter = require('../ods-main/router/page-router');

const Deeplink = {

    TYPE: {
        OPEN_BOOK: 'open-book',
        EDIT_ACCOUNT_COMPLETE: 'edit-account-complete',
        AUTH0_SIGNIN: 'auth0-signin',
    },

    getDeeplinkParam(url) {
        const parseUrl = new URL(url);

        if (parseUrl && parseUrl.pathname) {
            return parseUrl.pathname
                .split('/')
                .pop();
        }
        return '';
    },

    getDeeplinkType(param) {
        if (param.includes('edit-account')) {
            return Deeplink.TYPE.EDIT_ACCOUNT_COMPLETE;
        } else if (param.includes('callback')) {
            return Deeplink.TYPE.AUTH0_SIGNIN;
        } else {
            return Deeplink.TYPE.OPEN_BOOK;
        }
    },

    getSearchParams(url) {
        const searchParams = {};
        const parseUrl = new URL(url);

        for (const entry of parseUrl.searchParams.entries()) {
            searchParams[entry[0]] = entry[1];
        }
        return searchParams;
    },

    setParams(url) {
        if (url && (url.includes('deeplink') || url.includes('id.oup.com'))) {
            const param = this.getDeeplinkParam(url);
            const type = this.getDeeplinkType(param);

            if (param) {
                const searchParams = this.getSearchParams(url);

                global['action-deeplink'] = { type, param, ...searchParams };
            }
        }
    },

    onOpenURL(url) {
        if (url && (url.includes('deeplink') || url.includes('id.oup.com'))) {
            this.setParams(url);

            if (pageRouter && pageRouter.start) {
                pageRouter.start();
            }
        }
    },

    getParamFromArgs(args) {
        for (const arg of args) {
            if (arg.startsWith("olb://")) return arg;
        }
        return "";
    }
};

module.exports = Deeplink;