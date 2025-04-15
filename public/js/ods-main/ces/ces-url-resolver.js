const EnvConfig = require('../../config/env-config');
const URL = require('url');

class CesUrlResolver {

    static HELP_SUPPORT_PAGE = 1;
    static REGISTER_PAGE = 2;
    static SIGN_IN_PAGE = 3;

    static resolve(url) {
        if (this.resolvedToHelpSupport(url)) {
            return CesUrlResolver.HELP_SUPPORT_PAGE;
        } else if (this.resolvedToRegisterPage(url)) {
            return CesUrlResolver.REGISTER_PAGE;
        } else if (this.resolvedToSignInPage(url)) {
            return CesUrlResolver.SIGN_IN_PAGE;
        }
    }

    static resolvedToHelpSupport(url) {
        return url.endsWith('#support') || url.includes('/help/');
    }

    static resolvedToRegisterPage(url) {
        return url.endsWith('#register');
    }

    static resolvedToSignInPage(url) {
        return url && url.startsWith(EnvConfig.get(EnvConfig.OLBConfig.OLB_BOOKSHELF));
    }


    static redirectedWithAuthorizationCode(url) {
        return url.startsWith(EnvConfig.get(EnvConfig.OLBConfig.OLB_BOOKSHELF))
            && this.hasAuthorizationCode(url);
    }

    static hasAuthorizationCode(url) {
        const parsedURL = URL.parse(url);

        if (parsedURL.query) {
            const queries = parsedURL.query.split('&');

            for (const query of queries) {
                if (query.startsWith('code=')) return true;
            }
        }
        return false;
    }

    static getAuthorizationCode(url) {
        const parsedURL = URL.parse(url);
        const queries = parsedURL.query.split('&');

        for (const query of queries) {
            if (query.startsWith('code=')) {
                return query.split('=')[1];
            }
        }
        return null;
    }
}

module.exports = CesUrlResolver;