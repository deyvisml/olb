const AWS = require('aws-sdk');

const EnvConfig = require('../../config/env-config');
const NetworkUtils = require('../../utils/network-utils');

const CES = require('./ces-api-client');
const ODStore = require('../ods-store');

const CESPreprocessor = {

    FALLBACK: {
        CommonVariables: {
            name:       '^.+$',
            email:      '^[a-zA-Z0-9!#$%&\'*+/=?^_`{|}~-]+(?:\\\\.[a-zA-Z0-9!#$%&\'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\\\\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$',
            password:   '^(?=.*[a-z])(?=.*[A-Z])\\S{6,}$'
        },
        LearnMore: {
            learn_more_ally_title_text: '(link opens in a pop up)',
            learn_more_content_final_page_subtitle: 'Invite students and teachers to join and set up classes. Assign learning material so that everyone is ready on the first day of school.',
            learn_more_content_final_page_title: 'Invite your students and teachers',
            learn_more_content_final_page_button1_text: 'Register to get started',
            learn_more_content_final_page_button1_path: 'https://dev.account.oup.com/register',
            learn_more_content_final_page_button2_text: '',
            learn_more_content_final_page_button2_path: '',
            page_image_source_1: 'https://dev.account.oup.com/media/learn-more/olb/en.png?version=20190405',
            page_image_alt_text_1: 'Oxford Learner\'s Bookshelf for Schools. Get students started more quickly. Simple enrolment. Class management. Ready to go.',
            page_body_1: 'You can be a teacher for just one class, or an administrator for a whole school',
            page_header_1: 'Register as a teacher or organization',
        }
    },

    RESERVED: {
        COGNITO_CREDENTIAL:     'aws.cognito.credential',
        CES_COMMON_VARIABLE:    'ces.common.variable',
        CES_COMMON_CONTENT:     'ces.common.content',
        CES_COLLECTIONS:        'ces.collections',
    },

    prepare(key, forceRefresh = false) {
        switch (key) {
        case this.RESERVED.COGNITO_CREDENTIAL:
            this.prepareCognitoIdentity(key, forceRefresh);
            break;

        case this.RESERVED.CES_COMMON_VARIABLE:
            this.prepareCommonVariable(key, forceRefresh);
            break;

        case this.RESERVED.CES_COMMON_CONTENT:
            this.prepareCommonContent(key, forceRefresh);
            break;
        }
    },

    async prepareCognitoIdentity(key, forceRefresh) {
        let identityId = ODStore.get(key);

        if (identityId == null || forceRefresh) {
            identityId = await this.getCognitoCredential();

            if (identityId != null) {
                ODStore.set(key, identityId);
            }
        }
    },

    getCognitoCredential() {
        return new Promise((resolve) => {
            const identityId = ODStore.get(this.RESERVED.COGNITO_CREDENTIAL);

            if (identityId) resolve(identityId);

            const credentials = new AWS.CognitoIdentityCredentials({
                IdentityPoolId: EnvConfig.get(EnvConfig.CESConfig.CES_COGNITO_POOL_ID)
            }, {
                region: 'eu-west-1'
            });

            credentials.get(() => {
                if (credentials.identityId) {
                    ODStore.set(this.RESERVED.COGNITO_CREDENTIAL, credentials.identityId);
                }
                resolve(credentials.identityId);
            });
        });
    },

    async prepareCommonVariable(key, forceRefresh) {
        global.commonVariable = ODStore.get(key) || this.FALLBACK.CommonVariables;

        if (forceRefresh && NetworkUtils.isOnline()) {
            const { success, body } = await CES.API.getCommonVariable();

            if (success && body?.data?.rules) {
                global.commonVariable = {
                    name: body.data.rules.NAME_REGEX,
                    email: body.data.rules.EMAIL_REGEX,
                    password: body.data.rules.PASSWORD_REGEX,
                };
                ODStore.set(key, global.commonVariable);
            }
        }
    },

    getCommonVariable() {
        return ODStore.get(this.RESERVED.CES_COMMON_VARIABLE) || this.FALLBACK.CommonVariables;
    },

    async prepareCommonContent(key, forceRefresh) {
        if (forceRefresh && NetworkUtils.isOnline()) {
            const { success, body } = await CES.API.getCommonContents();

            if (success && body?.data?.learnMoreInvitation) {
                ODStore.set(key, body.data.learnMoreInvitation);
            }
        }
    },

    getCommonContent() {
        return ODStore.get(this.RESERVED.CES_COMMON_CONTENT) || this.FALLBACK.LearnMore;
    },

};

module.exports = CESPreprocessor;