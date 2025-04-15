const crypto = require('crypto-js');
const URL = require('url');

const APIUtils = {

    stripHost(url) {
        const parsedURL = URL.parse(url);

        return parsedURL.path;
    },

    getBasicAuthHeader(credential) {
        return {
            'X-LRS-Authorization': credential,
            'X-Organisations': '',
            'X-Assignments': '',
            'Content-Type': 'application/json'
        };
    },

    getHmacRequestParams(url, timestamp, hashString, hmacKey) {
        return {
            url: url,
            timeout: 30000,
            headers: {
                'X-Authorization': crypto.HmacSHA256(hashString, hmacKey).toString(),
                'X-Timestamp': timestamp
            }
        };
    }

};

module.exports = APIUtils;