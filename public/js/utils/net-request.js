"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const querystring_1 = __importDefault(require("querystring"));
const electron_1 = require("electron");
const NetRequest = function ({ method = 'GET', headers, url, query = null, body = null, }) {
    return new Promise((resolve, reject) => {
        const queryString = query ? `?${querystring_1.default.stringify(query)}` : '';
        const request = electron_1.net.request({
            method: method || 'GET',
            url: url + queryString,
        });
        setHeader(request, headers);
        setRequestBody(request, body);
        exec(request, resolve, reject);
    });
    function setHeader(request, headers) {
        if (headers) {
            for (const [key, value] of Object.entries(headers)) {
                if (value == null)
                    continue;
                request.setHeader(key, value);
            }
        }
    }
    function setRequestBody(request, body) {
        if (body)
            request.write(body);
    }
    function getFormattedBody(contentType, data) {
        if (contentType?.includes('application/json')) {
            return JSON.parse(data.map(chunk => chunk.toString()).join(''));
        }
        else if (contentType?.includes('text/html') || contentType?.includes('text/plain')) {
            return data.map(chunk => chunk.toString()).join('');
        }
        else {
            return Buffer.concat(data);
        }
    }
    function exec(request, resolve, reject) {
        const data = [];
        request.on('error', (error) => {
            // Fails to issue a network request
            reject({
                statusCode: 408,
                body: error,
            });
        });
        request.on('response', (response) => {
            response.on('data', (chunk) => {
                data.push(Buffer.from(chunk));
            });
            response.on('end', () => {
                try {
                    const contentType = response.headers['content-type'] ?? request.getHeader('content-type');
                    const formattedBody = getFormattedBody(contentType, data);
                    if (response.statusCode < 400) {
                        resolve({
                            statusCode: response.statusCode,
                            headers: response.headers,
                            body: formattedBody,
                        });
                    }
                    else {
                        reject({
                            statusCode: response.statusCode,
                            headers: response.headers,
                            error: formattedBody,
                        });
                    }
                }
                catch (error) {
                    reject({
                        statusCode: 500,
                        headers: response.headers,
                        body: error,
                    });
                }
            });
            response.on('error', () => {
                reject({
                    statusCode: response.statusCode,
                });
            });
        });
        request.end();
    }
};
exports.default = NetRequest;
module.exports = NetRequest;
