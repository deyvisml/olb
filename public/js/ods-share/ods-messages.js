"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable arrow-body-style */
const messages = {
    // System
    system_requirement_insufficient: 'Your computer must meet the minimum system requirements to run this application.',
    // Common Errors
    service_temporarily_unavailable: 'Oxford Learner\'s Bookshelf is temporarily unavailable. Please try again later. If you continue to have problems, please email Customer Support at eltsupport@oup.com.',
    network_connection_required: 'Please check your internet connection and try again.',
    date_and_time_is_not_valid_signin: 'For security, Oxford Learner’s Bookshelf only allows you to sign in from devices with the correct Date & Time settings.\nPlease correct the Date & Time settings on your device and then try signing in again.',
    date_and_time_is_not_valid_bookshelf: 'For security, Oxford Learner’s Bookshelf could restrict features from devices with incorrect Date & Time settings.\nPlease correct the Date & Time settings on your device and then try again.',
    // Update Application
    application_update_available: 'A new version of Oxford Learner\'s Bookshelf is available.',
    application_update_detail: (version) => `Oxford Learner's Bookshelf ${version} is now available.\nWould you like to update now or on close?\n`,
    // Menu
    application_uninstall_guide: 'Are you sure you want to remove the Oxford Learner\'s Bookshelf app from your computer?\nAll of your downloaded books will also be removed.',
    application_uninstall_offline: 'You are offline. If you uninstall the Oxford Learner\'s Bookshelf app now, any changes you have made to your books will be lost.\nPlease connect to the internet and sync your changes to the Cloud before uninstalling the app.',
    application_uninstall_complete: 'The Oxford Learner\'s Bookshelf app has been removed from your computer.',
    application_shared_content_guide: 'Downloaded content will be available to anyone who uses this device and has a licence for that content.\nYou can undo this change by uninstalling and then re-installing the app.',
    // Sign in & Register - Form Validations
    firstname_is_required: 'Please enter your first name',
    lastname_is_required: 'Please enter your last name',
    username_is_required: 'Please enter your username',
    email_is_required: 'Please enter your email address',
    password_is_required: 'Please enter a password',
    username_is_invalid: 'Please enter a valid username',
    username_already_exist: 'This username has already been registered. Please sign in, or register with a different username. If you have forgotten your password, you can reset this from the sign in page.',
    username_connection_required: 'Internet connection is required to check the availability of username. Please check your internet connection and try again.',
    email_is_invalid: 'Please enter a valid email address',
    email_already_exist: 'This email has already been registered. Please use a different email.',
    password_is_invalid: 'Your password must be a minimum of 6 characters and include at least one lower case letter and one upper case letter, with no spaces.',
    password_not_equal: 'The passwords are not the same',
    password_same_to_previous: 'Your new password cannot be the same as any of your previous 4 passwords',
    toc_is_not_agreed: 'Please agree to our Terms and Conditions',
    // Bookshelf
    etype_is_not_available: 'This title can only be read on an Apple device (iPad or iPad mini)',
    ntype_is_not_available: 'This title can only be read on iPad.',
    book_no_longer_available: 'This title is no longer available.\nPlease email Customer Support at eltsupport@oup.com.',
    // Download & Delete
    book_delete_failed_in_use: 'This book is in use and cannot be deleted at the moment.\nPlease close and re-open the app, then try deleting the book again. If you continue to see this message, please contact Customer Support at eltsupport@oup.com for help.',
    // Redeem
    access_code_is_required: 'Please enter an access code. Contact customer support if you need help.',
    access_code_is_invalid: 'This access code is not correct. Contact customer support if you need help.',
    access_code_is_not_found: 'This access code is not correct. Please try again. Contact customer support if you need help.',
    access_code_not_for_olb: 'This code is not for e-books on Oxford Learner\'s Bookshelf. Please ask your teacher for help.',
    access_code_is_expired: 'Your access code has expired. Please contact Customer Support at eltsupport@oup.com.',
    access_code_not_activated: (date) => `The code is not yet active. You can use it on ${date}.`,
    access_code_is_assigned_to_org: 'Activation code is assigned to an organization. Please ask the person who gave you the code for help.',
    access_code_already_used: 'This access code has already been used. Contact customer support if you need help.',
    access_code_already_licensed: 'This content is already on your bookshelf. Contact customer support if you need help.',
    // Reading Diary & Certificate
    diary_request_hide: (title) => `Do you want to hide '${title}' from your Reading diary?`,
    diary_go_to_bookshelf: (title) => `Go to your Bookshelf to continue reading '${title}'`,
    certificate_require_sign_in: 'You have been logged out.\nPlease click \'Log in\' and enter your username and password to continue using the Oxford Learner\'s Bookshelf.',
    certificate_csv_offline: 'Please connect to the internet to download your reading progress.',
    certificate_pdf_offline: 'Please connect to the internet to download your reading certificate.'
};
exports.default = messages;
module.exports = messages;
