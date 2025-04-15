const crypto = require('crypto');
const EnvConfig = require("../../config/env-config");
const DeviceUtils = require('../../utils/device-utils');

const Auth0 = {

    URL: {
        buildSigninUrl({ hostname, clientId, redirectUrl, state, codeChallenge, audience }) {
            let url = `${hostname}/authorize`;

            url += `?response_type=code`;
            url += `&client_id=${clientId}`;
            url += `&redirect_uri=${redirectUrl}`;
            url += `&state=${state}`;
            url += `&scope=${encodeURIComponent('openid email profile offline_access')}`;
            url += `&code_challenge=${codeChallenge}`;
            url += `&code_challenge_method=S256`;
            url += `&audience=${audience}`;
            url += `&providerId=OLB_MOBILE`;
            url += `&oup-idp-ui=OLB_MOBILE`;

            return url;
        },

        buildSigninUrlWithConnection({ hostname, clientId, redirectUrl, connection, audience, register }) {
            let url = `${hostname}/authorize`;

            url += `?scope=${encodeURIComponent('openid email profile offline_access')}&`;
            url += `response_type=code&`;
            url += `client_id=${clientId}&`;
            url += `redirect_uri=${encodeURIComponent(redirectUrl)}&`;
            url += `connection=${connection}&`;
            url += `audience=${encodeURIComponent(audience)}&`;

            url += `prompt=select_account&`;

            if (register) {
                url += `isSignUp=1&`;
            }
            url += `providerId=OLB_MOBILE`;

            return url
        },

        redirectUrlForDeeplink() {
            return EnvConfig.get(EnvConfig.Auth0Config.AUTH0_CALLBACK_URL);
        },
    },

    Params: {
        getCodeVerifier() {
            const bytes = crypto.randomBytes(32);
            return this.base64EncodeBytes(bytes);
        },

        getCodeChallenge(codeVerifier) {
            const hashedVerifier = crypto.createHash('sha256')
                .update(codeVerifier)
                .digest();

            return this.base64EncodeBytes(hashedVerifier);
        },

        base64EncodeBytes(bytes) {
            return bytes.toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=/g, '');
        },
    },
}

module.exports = Auth0;