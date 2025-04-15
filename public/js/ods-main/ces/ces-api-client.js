const NetworkUtils = require('../../utils/network-utils');
const EnvConfig = require('../../config/env-config');
const NetRequest = require('../../utils/net-request')

const Auth0 = require('../auth0/auth0');
const CesAuthService = require('./ces-auth-service');
const Auth0Credential = require('../auth0/auth0-credential');

const CES = {

    CONFIG: {
        MAX_RETRY:      2,
        PLATFORM_ID:    'elt_olb',
        ELT_SYSTEM_ID:  'elt_olb',
        FILTER_DEFAULT: 'ELT_OLB',
        FILTER_MASTER:  'ELT_OLB_MASTER',
    },

    BASE_URL: null,

    RESPONSE: {
        HTTP_OK: 200,
        HTTP_FORBIDDEN: 403,
    },

    CLIENT: {
        forceExecute() {
            return (process.env.runtime === 'spectron' || process.env.runtime === 'mocha');
        },

        isSigningRequired(path) {
            return !path.includes('/open/');
        },

        securePreparation() {
            if (this.BASE_URL == null) {
                this.BASE_URL = EnvConfig.get(EnvConfig.CESConfig.CES_BASE_URL);
                this.BASE_URL += `/api/${EnvConfig.get(EnvConfig.Auth0Config.AUTH0_GATEWAY_PATH)}`
            }
        },

        async getRequestParams(method, path, payload = null, query = null) {
            const url = this.BASE_URL + path;
            const params = {
                method: method,
                url: url,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            if (this.isSigningRequired(path)) {
                params.headers['authorization'] = `Bearer ${Auth0Credential.idToken}`;
            }
            if (query != null) params.query = query;
            if (payload != null) params.body = JSON.stringify(payload);

            return params;
        },

        async send({ method, path, payload, query }) {
            if (NetworkUtils.isOffline() && !this.forceExecute()) return;

            let statusCode = 500;
            let success = false;
            let body = null;
            let retryCount = 0;

            this.securePreparation();

            do {
                try {
                    const params = await this.getRequestParams(method, path, payload, query);
                    const response = await NetRequest(params);

                    statusCode = response.statusCode;
                    success = response.statusCode === 200 && response.body?.status;
                    body = response.body;
                } catch (e) {
                    body = e.response?.body;

                    if (this.isIdTokenExpired(e)) {
                        await this.refreshIdToken();
                    }
                }
            } while (CES.CONFIG.MAX_RETRY > ++retryCount && !success);

            return { statusCode, success, body };
        },

        isIdTokenExpired(response) {
            return (response.statusCode === 403 || response.statusCode === 500);    // 500 for temporary
        },

        async refreshIdToken() {
            const response = await CesAuthService.API.refreshIdToken({
                clientId: EnvConfig.get(EnvConfig.Auth0Config.INTEGRATION_CLIENT_ID),
                refreshToken: Auth0Credential.refreshToken,
            });

            if (CesAuthService.CLIENT.isSuccessResponse(response)) {
                Auth0Credential.set({
                    idToken: response.body.id_token,
                });
            } else if (CesAuthService.CLIENT.isRefreshTokenExpired(response)) {
                CesAuthService.Handler.onRefreshTokenExpired();
            }
            return response;
        }
    },

    API: {
        isRequestSucceed(response) {
            return (response?.success && response?.body?.status === 'success');
        },

        async getEnvironmentConfig() {
            return await CES.CLIENT.send({
                method: 'GET',
                path: '/open/environment'
            });
        },

        async getCommonVariable() {
            return await CES.CLIENT.send({
                method: 'GET',
                path: '/open/common-variables?rules=NAME_REGEX,PASSWORD_REGEX,EMAIL_REGEX',
            });
        },

        async getCommonContents() {
            return await CES.CLIENT.send({
                method: 'GET',
                path: '/open/content?blocks=learnMoreInvitation',
            });
        },

        async acceptTermsAndConditions(userId) {
            return await CES.CLIENT.send({
                method: 'PUT',
                path: `/open/user/${userId}/olb-registration`
            });
        },

        async checkGlobalUserEmail(email) {
            return await CES.CLIENT.send({
                method: 'GET',
                path: '/open/user/check-email',
                query: {
                    emailAddress: email
                }
            });
        },

        async sendEmailInvitation(email) {
            return await CES.CLIENT.send({
                method: 'POST',
                path: '/open/send-email-invitation',
                payload: {
                    userName: email
                }
            });
        },

        async registerUser(payload) {
            return await CES.CLIENT.send({
                method: 'POST',
                path: '/open/user',
                payload: payload
            });
        },

        async getIdentityDetails() {
            return await CES.CLIENT.send({
                method: 'POST',
                path: '/identity',
                payload: {
                    userId: null
                },
            });
        },

        async confirmPassword(password) {
            return await CES.CLIENT.send({
                method: 'POST',
                path: '/user/confirm-password',
                payload: { password },
            });
        },

        async updateEmail(userId, userName) {
            return await CES.CLIENT.send({
                method: 'POST',
                path: `/user/${userId}/finish`,
                payload: { email: userName },
            });
        },

        async updateUserDetails(firstName, lastName) {
            return await CES.CLIENT.send({
                method: 'PUT',
                path: '/user',
                payload: { firstName, lastName },
            });
        },

        async updateSigninDetails(payload) {
            return await CES.CLIENT.send({
                method: 'PUT',
                path: '/user/auth',
                payload: payload,
            });
        },

        async getUserLicences(userId, filter) {
            return await CES.CLIENT.send({
                method: 'GET',
                path: `/user/${userId}/licences/${filter}`,
                query: {
                    returnExternalIds: true,
                    platformId: CES.CONFIG.PLATFORM_ID
                },
            });
        },

        async getUserAssignments(userId) {
            return await CES.CLIENT.send({
                method: 'POST',
                path: '/userAssignments/olb/query',
                payload: {
                    userId: userId,
                    systemId: CES.CONFIG.ELT_SYSTEM_ID,
                    returnExternalIds: true,
                    returnLinkedProducts: true,
                }
            });
        },

        async validateCode(activationCode, reCAPTCHAToken) {
            return await CES.CLIENT.send({
                method: 'POST',
                path: '/products/validate-code',
                payload: {
                    activationCode: activationCode,
                    reCAPTCHAToken: reCAPTCHAToken,
                    reCAPTCHATokenSource: 'olb',
                    systemId: CES.CONFIG.ELT_SYSTEM_ID,
                }
            });
        },

        async activateCode(userId, activationCode) {
            return await CES.CLIENT.send({
                method: 'POST',
                path: '/products/redeem-code',
                payload: {
                    userId: userId,
                    activationCode: activationCode,
                    systemIdFilter: CES.CONFIG.ELT_SYSTEM_ID,
                    getLicenceDetails: 'true'
                }
            });
        },

        async lookupProductId(userId, externalId, type = 'bid') {
            return await CES.CLIENT.send({
                method: 'POST',
                path: '/products/id-lookup',
                payload: {
                    productIdType: 'EXTERNAL',
                    productSystemId: CES.CONFIG.ELT_SYSTEM_ID,
                    productTypeId: type,
                    productId: [
                        externalId
                    ]
                }
            });
        },

        async registerProduct(productId) {
            return await CES.CLIENT.send({
                method: 'POST',
                path: '/user/register-product',
                payload: {
                    license: {
                        enabled: true,
                        productId: productId
                    }
                }
            });
        },

        async getInvitations() {
            return await CES.CLIENT.send({
                method: 'GET',
                path: '/user/invite'
            });
        },

        async updateInvitation(userId, invitation) {
            return await CES.CLIENT.send({
                method: 'PUT',
                path: `/user/${userId}/invite/${invitation.orgId}`,
                payload: {
                    invitationStatus: invitation.status,
                    roleName: invitation.roleName
                }
            });
        },
    }

};

module.exports = CES;