const EnvConfig = require("../../config/env-config");
const UserRepository = require("../../data/repository/user-repository");
const LibraryRepository = require('../../data/repository/library-repository');
const User = require("../../data/user");
const Auth0Credential = require('./auth0-credential');
const CesAuthService = require("../ces/ces-auth-service");
const CES = require("../ces/ces-api-client");
const CESParser = require("../ces/ces-parser");

const Auth0Controller = {
    async onAuthorizationCodeArrived({ event, authorizationCode, redirectionUrl, codeVerifier }) {
        const { success, body } = await CesAuthService.API.getIdToken({
            authorizationCode: authorizationCode,
            clientId: EnvConfig.get(EnvConfig.Auth0Config.INTEGRATION_CLIENT_ID),
            redirectUri: redirectionUrl,
            codeVerifier: codeVerifier
        });

        if (success && body?.id_token && body?.refresh_token) {
            Auth0Credential.set({
                idToken: body.id_token,
                refreshToken: body.refresh_token,
            });

            const user = await UserRepository.create();

            if (user && user instanceof User) {
                const { success, body } = await CES.API.getUserLicences(user.userId, CES.CONFIG.FILTER_MASTER);

                if (success && body) {
                    if (CESParser.hasSampleProduct(body) === false) {
                        await CES.API.registerProduct(EnvConfig.get(EnvConfig.OLBConfig.OLB_SAMPLE_PRODUCT));
                    }
                    user.legacy = user.missingFields.includes('email');
                    user.partial = !CESParser.hasMasterProduct(body);
                }
            }

            // Force cache collection and book data before entering the bookshelf.
            // If collection and book data is not cached, unnecessary API calls will be made.
            await LibraryRepository.invalidate(user.userId);

            event.sender.send('auth-signin-post-signin', this.isValidUserResponse(user) ? user : null);
        }
    },

    isValidUserResponse(user) {
        return user
            && user.userId
            && user.userName;
    }
}

module.exports = Auth0Controller;