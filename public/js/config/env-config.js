const fs = require('fs');
const packageInfo = require('../../../package.json');

const ODStore = require('../ods-main/ods-store');

const EnvConfig = {

    Environments: {
        'DEV': 'DEV',
        'TEST': 'TEST',
        'UAT': 'UAT',
        'PRE-PROD': 'PRE-PROD',
        'PERF': 'PERF',
        'PROD': 'PROD',
    },

    Env: null,

    CESConfig: {
        OUP_HUB_BASE_URL: 'OUP_HUB_BASE_URL',
        CES_BASE_URL: 'CES_BASE_URL',
        CES_COGNITO_POOL_ID: 'CES_COGNITO_POOL_ID',
        CES_TR_PANEL_URL: 'CES_TR_PANEL_URL',
        CES_URL_REGISTER: 'CES_URL_REGISTER',
        CES_URL_EDIT_PROFILE: 'CES_URL_EDIT_PROFILE',
    },

    Auth0Config: {
        AUTH0_IDP_URL: 'AUTH0_IDP_URL',
        AUTH0_AUDIENCE: 'AUTH0_AUDIENCE',
        AUTH0_GATEWAY_PATH: 'AUTH0_GATEWAY_PATH',
        AUTH0_CALLBACK_URL: 'AUTH0_CALLBACK_URL',
        INTEGRATION_CLIENT_ID: 'INTEGRATION_CLIENT_ID',
    },

    OLBConfig: {
        OLB_MASTER_PRODUCT: 'OLB_MASTER_PRODUCT',
        OLB_SAMPLE_PRODUCT: 'OLB_SAMPLE_PRODUCT',
        OLB_BOOKSHELF: 'OLB_BOOKSHELF',
        OLB_UPDATE_PATH_FRAGMENT: 'ODS_UPDATE_PATH_FRAGMENT',
        OLB_MIDDLEWARE_HOSTNAME: 'OLB_MIDDLEWARE_HOSTNAME',
        OLB_RECAPTCHA_SITE_KEY: 'OLB_RECAPTCHA_SITE_KEY',
    },

    defaultConfigs: {},

    isProd() {
        return this.Env === this.Environments.PROD;
    },

    init() {
        // Since ODStore store configs per environment, this should be called at first.
        ODStore.setEnvTag(EnvConfig.Env);

        const path = `${__dirname}/environment.json`;

        this.defaultConfigs = JSON.parse(fs.readFileSync(path, 'utf8'));
    },

    async invalidateConfig() {
        // Since the env-config should be imported very first line of other component.
        // EnvConfig should not import other custom module.
        const CES = require('../ods-main/ces/ces-api-client');  // eslint-disable-line
        const { success, body } = await CES.API.getEnvironmentConfig();

        if (success && body?.status === 'success') {
            const config = body.data;

            if (config.urls) {
                ODStore.set(EnvConfig.CESConfig.CES_URL_REGISTER, config.urls['register-choice']);
                ODStore.set(EnvConfig.CESConfig.CES_URL_EDIT_PROFILE, config.urls['edit-account']);
            }
            if (config?.sso?.cognitoPoolId) {
                ODStore.set(EnvConfig.CESConfig.CES_COGNITO_POOL_ID, config.sso.cognitoPoolId);
            }
            if (config?.integrations?.ces?.baseUrl) {
                ODStore.set(EnvConfig.CESConfig.CES_BASE_URL, config.integrations.ces.baseUrl);
            }
            if (config?.idp?.auth0) {
                ODStore.set(EnvConfig.Auth0Config.AUTH0_IDP_URL, config.idp.auth0.idpUrl);
                ODStore.set(EnvConfig.Auth0Config.AUTH0_AUDIENCE, config.idp.auth0.audience);
                ODStore.set(EnvConfig.Auth0Config.AUTH0_GATEWAY_PATH, config.idp.auth0.gatewayPath);
            }
            if (config?.integrations?.olb_offline?.oidcClientId) {
                ODStore.set(EnvConfig.Auth0Config.INTEGRATION_CLIENT_ID, config.integrations.olb_offline.oidcClientId);
            }
        }
    },

    get(key) {
        return ODStore.get(key) ?? this.defaultConfigs[key];
    },
};

EnvConfig.Env = EnvConfig.Environments[packageInfo.environment];
EnvConfig.init();

module.exports = EnvConfig;