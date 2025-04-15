"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DownloadStatus = {
    CANDIDATE: 'candidate',
    WAITING: 'waiting',
    PRIOR_TASK: 'prior-task',
    PROGRESSING: 'progressing',
    PAUSED: 'paused',
    CANCELED: 'canceled',
    EXTRACTING: 'extracting',
    COMPLETED: 'completed',
    INTERRUPTED: 'interrupted',
    getDisplayText: (status) => {
        switch (status) {
            case DownloadStatus.WAITING:
                return 'Waiting';
            case DownloadStatus.PRIOR_TASK:
                return 'Preparing';
            case DownloadStatus.PROGRESSING:
                return 'Pause';
            case DownloadStatus.PAUSED:
                return 'Resume';
            case DownloadStatus.EXTRACTING:
                return 'Extracting';
            case DownloadStatus.COMPLETED:
                return 'Completed';
        }
        return null;
    }
};
exports.default = DownloadStatus;
module.exports = DownloadStatus;
