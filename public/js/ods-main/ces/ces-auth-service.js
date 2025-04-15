const EnvConfig = require('../../config/env-config');
const NetRequest = require('../../utils/net-request');

const CesAuthService = {

    CONFIG: {
        MAX_RETRY: 2,
    },

    BASE_URL: null,

    CLIENT: {
        securePreparation() {
            if (this.BASE_URL == null) {
                this.BASE_URL = EnvConfig.get(EnvConfig.Auth0Config.AUTH0_IDP_URL);
            }
        },

        getRequestParams(method, path, payload = null, query = null) {
            const params = {
                method: method,
                url: this.BASE_URL + path,
            };

            if (query) params.query = query;
            if (payload) params.body = JSON.stringify(payload);

            return params;
        },

        isSuccessResponse(response) {
            return (response
                && response.statusCode === 200
                && response.body
                && response.body.access_token != null
                && response.body.id_token != null);
        },

        async send({ method, path, payload, query }) {
            let statusCode = 500;
            let success = false;
            let body = null;
            let retryCount = 0;

            this.securePreparation();

            do {
                try {
                    const params = this.getRequestParams(method, path, payload, query);
                    const response = await NetRequest({
                        ...params,
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });

                    success = CesAuthService.CLIENT.isSuccessResponse(response);
                    statusCode = response.statusCode;
                    body = response.body;
                } catch (e) {
                    body = e.response?.body;
                    statusCode = e.statusCode || statusCode;
                }
            } while (CesAuthService.CONFIG.MAX_RETRY > ++retryCount && !success);

            return { statusCode, success, body };
        },

        isRefreshTokenExpired(response) {
            return (response?.statusCode === 403);
        },
    },

    API: {
        async getIdToken({ authorizationCode, clientId, redirectUri, codeVerifier }) {
            return await CesAuthService.CLIENT.send({
                method: 'POST',
                path: '/oauth/token',
                payload: {
                    grant_type: 'authorization_code',
                    code: authorizationCode,
                    client_id: clientId,
                    redirect_uri: redirectUri,
                    code_verifier: codeVerifier,
                }
            });
        },

        async refreshIdToken({ clientId, refreshToken }) {
            return await CesAuthService.CLIENT.send({
                method: 'POST',
                path: '/oauth/token',
                payload: {
                    grant_type: 'refresh_token',
                    client_id: clientId,
                    refresh_token: refreshToken,
                }
            });
        },

        async signout({ clientId, redirectUri }) {
            return await CesAuthService.CLIENT.send({
                method: 'GET',
                path: '/v2/logout',
                query: {
                    client_id: clientId,
                    returnTo: redirectUri,
                }
            });
        }
    },

    Handler: {
        onRefreshTokenExpired() {
            const pageRouter = require('../router/page-router');

            pageRouter.pageRouteSignout();
        }
    }
};

module.exports = CesAuthService;