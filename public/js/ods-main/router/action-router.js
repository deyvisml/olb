const path = require('path');

const { ipcMain, dialog, app } = require('electron');

const FileIO = require('../../utils/file-io');
const showDialog = require('../../utils/dialogs');

const CES = require('../ces/ces-api-client');
const CESParser = require('../ces/ces-parser');

const LearningRecordService = require('../../middleware/learning-record-service');
const UserRepository = require('../../data/repository/user-repository');
const LibraryRepository = require('../../data/repository/library-repository');
const DiaryRepository = require('../../data/repository/diary-repository');
const PreferenceRepository = require('../../data/repository/preference-repository');
const ContentService = require('../../middleware/content-service');
const { ConfigKey } = require('../../middleware/config-service');

/**
 *  Actions are fired from User.
 */
const ActionRouter = {

    register() {
        ipcMain.on('action-register-partial-request', this.onPartialRegisterRequest);
        ipcMain.on('action-register-legacy-request', this.onLegacyRegisterRequest);
        ipcMain.on('action-check-email-registered', this.onCheckEmailRegistered);

        ipcMain.on('action-check-password-request', this.onCheckPassword);
        ipcMain.on('action-invalidate-user-details-request', this.onInvalidateUserDetails);
        ipcMain.on('action-update-user-details-request', this.onUpdateUserDetails);
        ipcMain.on('action-change-sign-details-request', this.onUpdateSignDetails);

        ipcMain.on('action-redeem-request', this.onRedeemRequest.bind(this));
        ipcMain.on('action-activation-request', this.onActivationRequest.bind(this));

        ipcMain.on('action-invitations-request', this.onAggregateInvitations);
        ipcMain.on('action-update-invitation-request', this.onUpdateInvitation.bind(this));

        ipcMain.on('action-diary-certificate', this.onReadingCertificateRequested.bind(this));

        ipcMain.on('action-diary-hide-book', async (event, userId, bid, flag) => {
            try {
                await LearningRecordService.updateHideStats(bid, flag);

                await DiaryRepository.invalidate(userId);
            } catch (ignore) {}
        });

        ipcMain.on('action-teacher-resource-accept-terms', async () => {
            await PreferenceRepository.set(global.user.id, ConfigKey.TEACHER_RESOURCE_TERMS_ACCEPTED, true);
        });

        ipcMain.on('action-bookshelf-filter-changed', async (event, filter) => {
            await PreferenceRepository.set(global.user.id, ConfigKey.BOOKSHELF_BOOK_FILTER, filter);
        });

        ipcMain.on('action-toolbar-position-changed', async (event, position) => {
            const validPositions = ['top', 'bottom', 'left', 'right'];

            if (validPositions.includes(position)) {
                await PreferenceRepository.set(global.user.id, ConfigKey.TOOLBAR_POSITION, position);
            }
        });
    },

    async onPartialRegisterRequest(event) {
        const response = await CES.API.acceptTermsAndConditions(global.user.id);

        event.sender.send('action-register-partial-response', response);
    },

    async onLegacyRegisterRequest(event, email) {
        await CES.API.updateEmail(global.user.id, email);

        const response = await CES.API.acceptTermsAndConditions(global.user.id);

        event.sender.send('action-register-legacy-response', response);
    },

    async onCheckEmailRegistered(event, email) {
        const response = await CES.API.checkGlobalUserEmail(email);

        event.returnValue =
            CES.API.isRequestSucceed(response) && response.body?.data?.exists;
    },

    async onCheckPassword(event, password) {
        const response = await CES.API.confirmPassword(password);

        event.sender.send('action-check-password-response', response);
    },

    async onInvalidateUserDetails(event) {
        await UserRepository.invalidate(global.user.id);

        event.sender.send('action-invalidate-user-details-response');
    },

    async onUpdateUserDetails(event, user) {
        const res = await CES.API.updateUserDetails(user.firstName, user.lastName);

        if (CES.API.isRequestSucceed(res)) {
            await UserRepository.invalidate(global.user.id);
        }
        event.sender.send('action-update-user-details-response', res);
    },

    async onUpdateSignDetails(event, data, email) {
        let res = null;

        if (ActionRouter.shouldChangeSigninDetails(data)) {
            res = await CES.API.updateSigninDetails({
                origUserName: global.user.userName, /* mandatory fields for API */
                ...data,
            });
        }
        if (global.user.email !== email) {
            res = await CES.API.updateEmail(global.user.id, email);
        }
        if (CES.API.isRequestSucceed(res)) {
            await UserRepository.invalidate(global.user.id);
        }
        event.sender.send('action-change-sign-details-response', res);
    },


    async onRedeemRequest(event, code, reCAPTCHAToken) {
        let res = await CES.API.validateCode(code, reCAPTCHAToken);

        if (CES.API.isRequestSucceed(res)) {
            res = await CES.API.activateCode(global.user.id, code);

            if (CES.API.isRequestSucceed(res) && res.body.data.licenses) {
                const { bids, cids, licenseInfo } = CESParser.extractProductsForCode(res.body.data.licenses);

                if (bids && bids.length > 0) {
                    const response = await ContentService.getBookMetadata(bids);

                    res.books = response.body?.msg?.content_list;
                }
                if (cids && cids.length > 0) {
                    const response = await ContentService.getCollectionMetadata(cids);

                    res.collections = response.body?.msg?.content_list;
                }
                res.licenseInfo = licenseInfo;

                await LibraryRepository.invalidate(global.user.id);
            }
        }
        event.sender.send('action-redeem-response', res);
    },

    async onActivationRequest(event, code) {
        await CES.API.activateCode(global.user.id, code);
    },

    async onAggregateInvitations(event) {
        const response = await CES.API.getInvitations();

        if (CES.API.isRequestSucceed(response) && response.body?.data?.invites) {
            event.sender.send('action-invitations-response', response.body.data.invites);
        }
    },

    async onUpdateInvitation(event, invitation) {
        const response = await CES.API.updateInvitation(global.user.id, invitation);

        if (CES.API.isRequestSucceed(response) && invitation.status === 'ACCEPTED') {
            await LibraryRepository.invalidate(global.user.id);
            await UserRepository.invalidate(global.user.id);
        }

        event.sender.send('action-update-invitation-response', {
            status:     response.body.status,
            type:       invitation.status,
            orgId:      invitation.orgId,
            orgName:    invitation.orgName,
            roleName:   invitation.roleName
        });
    },

    async onReadingCertificateRequested(event, format) {
        const { firstName, lastName } = global.user;
        const filename = this.getReadingCertificateFilename(
            `${firstName}_${lastName}`,
            format,
        );

        dialog.showSaveDialog({
            title: 'Save file',
            filters: [{ name: format, extensions: [format] }],
            defaultPath: `${app.getPath('downloads')}${path.sep}${filename.replaceAll(' ', '_')}`
        }).then(async (result) => {
            if (result && result.filePath && !result.canceled) {
                try {
                    const response = await LearningRecordService.getReadingCertificate(
                        `${firstName} ${lastName}`,
                        format,
                    );

                    if (response.statusCode === 204) {
                        showDialog({
                            title: 'Certificate',
                            message: 'You don\'t have any information for a reading certificate yet. Go to your Bookshelf to start reading.',
                        });
                    } else {
                        FileIO.writeFile(result.filePath, response.body);

                        showDialog({
                            title: 'Certificate',
                            message: 'Download has been completed.',
                        });
                    }
                } catch (e) {
                    showDialog({
                        title: 'Certificate',
                        message: 'Download has failed.',
                        type: 'error',
                    });
                }
            } else {
                showDialog({
                    title: 'Certificate',
                    message: 'Download has been cancelled.',
                    type: 'error',
                });
            }
        });
    },

    getReadingCertificateFilename(username, format) {
        const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        const filenamePostfix = `${username} ${date}.${format}`.replaceAll(' ', '_')

        return (format === 'csv')
            ? `[Reading_Progress]_${filenamePostfix}`
            : `[Reading_Certificate]_${filenamePostfix}`;
    },

    shouldChangeSigninDetails(data) {
        return (data.newPassword || data.userName.toLowerCase() !== global.user.userName.toLowerCase());
    },

};

module.exports = ActionRouter;