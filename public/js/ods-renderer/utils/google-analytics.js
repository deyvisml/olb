"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_google_analytics4_1 = __importDefault(require("electron-google-analytics4"));
const node_machine_id_1 = require("node-machine-id");
const TRACKING_ID = 'G-VC64QK3WFP';
const SECRET_KEY = 'nq8pdOJ0SReR-uH40xWmYQ';
const analytics = new electron_google_analytics4_1.default(TRACKING_ID, SECRET_KEY, (0, node_machine_id_1.machineIdSync)());
async function screen(screenName) {
    /**
     *  https://developers.google.com/analytics/devguides/collection/protocol/ga4/sending-events
     *  In order for user activity to display in reports like Realtime,
     *  engagement_time_msec and session_id must be supplied as part of the params for an event.
     *  The engagement_time_msec parameter should reflect the event's engagement time in milliseconds.
     */
    analytics.set('engagement_time_msec', 1); // Realtime user tracking
    analytics.set('virtual_page_title', screenName);
    try {
        await analytics.event('page_view');
    }
    catch (ignore) { }
}
async function sendEvent(category, action, label = null, customDimensions = null) {
    /**
     *  EventName only allows letters, numbers, and underscores.
     *  Reference: https://support.google.com/analytics/answer/13316687
     */
    const eventName = `${category.toLowerCase()}_${action.toLowerCase()}`
        .replaceAll(' ', '_')
        .replaceAll('-', '_');
    if (label) {
        analytics.set('event_label', label);
    }
    if (customDimensions) {
        for (const [key, value] of Object.entries(customDimensions)) {
            if (key && value) {
                analytics.set(key, value);
            }
        }
    }
    try {
        await analytics.event(eventName);
    }
    catch (ignore) { }
}
const exportObject = {
    screen: screen,
    sendEvent: sendEvent,
    SCREEN: {
        LANDING: 'Landing',
        LOGIN: 'Login',
        LOGIN_HELP: 'Login Help',
        REGISTER: 'Register',
        REGISTER_HELP: 'Register Help',
        BOOKSHELF: 'Bookshelf',
        VIEWER: 'Viewer',
        REDEEM: 'Redeem',
        REDEEM_SUCCESS: 'Redeem Success',
        READING_DIARY: 'Reading Diary',
        CERTIFICATE: 'Certificate',
        HELP: 'Help',
        UPDATE_MY_DETAILS: 'Update My Details'
    },
    CATEGORY: {
        BOOKSHELF: 'Bookshelf',
        READING_DIARY: 'Readingdiary',
        CERTIFICATE: 'Certificate',
        TEACHER_RESOURCE: 'Teacher_Resource',
        USER: 'User'
    },
    ACTION: {
        SEARCH: 'Search',
        OPEN: 'Open',
        DETAIL: 'Detail',
        SCENE: 'Scene',
        AWARD: 'Award',
        DOWNLOAD: 'Download',
        LOGOUT: 'Logout',
    },
    TRIGGERED_BY: {
        BOOKSHELF: 'Bookshelf',
        VIEWER: 'Viewer'
    }
};
exports.default = exportObject;
module.exports = exportObject;
