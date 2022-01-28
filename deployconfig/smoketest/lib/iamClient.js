'use strict'

const request = require('request');
const debugLog = require('debug')('iamClient');

function checkStringObject(inputData) {
    if (typeof (inputData) === 'string') {
        try {
            return JSON.parse(inputData);
        } catch (err) {
            return {};
        }
    }
    return JSON.parse(inputData);
}

module.exports = class IAMClient {
    constructor(config) {
        debugLog(arguments);
        if (!config.IamUrl) {
            throw new Error('InvalidArgumentError: iamUrl is required');
        }
        if (!config.OauthUsername) {
            throw new Error('InvalidArgumentError: iamClient is required');
        }
        if (!config.OauthPassword) {
            throw new Error('InvalidArgumentError: iamClientPassword is required');
        }
        if (!config.IamUsername) {
            throw new Error('InvalidArgumentError: iamUserName is required');
        }
        if (!config.IamPassword) {
            throw new Error('InvalidArgumentError: iamUserPassword is required');
        }
        this.iamUrl = config.IamUrl;
        this.iamUserName = config.IamUsername;
        this.iamUserPassword = config.IamPassword;
        this.authorizationHeader = new Buffer.from(`${config.OauthUsername}:${config.OauthPassword}`).toString('base64');
        this.introspectAuthorizationHeader = new Buffer.from(`${config.IntrospectUsername}:${config.IntrospectPassword}`).toString('base64');
    }
    getAccessToken() {
        return new Promise((resolve, reject) => {
            let requestBody = `grant_type=password&username=${this.iamUserName}&password=${this.iamUserPassword}`;
            if (this.iamScope) {
                requestBody += `&scope=${this.iamScope}`;
            }
            const options = {
                url: `${this.iamUrl}/authorize/oauth2/token`,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Basic ${this.authorizationHeader}`,
                    Accept: 'application/json'
                },
                body: requestBody
            };
            request.post(options, (error, response, body) => {
                debugLog(`AccessTokenResponseBody=${body}`);
                const tokenResponse = checkStringObject(body);
                if (!error && response.statusCode === 200) {
                    debugLog(`IAM access token received: ${tokenResponse.access_token}`);
                    return resolve(tokenResponse.access_token);
                }
                console.log(`--- getAccessToken, options = ${JSON.stringify(options)}`);
                console.log(`--- getAccessToken, responseBody = ${JSON.stringify(body)}, status=${response.statusCode}`);
                return reject(new Error('AccessForbiddenError: Forbidden Access'));
            });
        });
    }
    getAccessTokenBody() {
        return new Promise((resolve, reject) => {
            let requestBody = `grant_type=password&username=${this.iamUserName}&password=${this.iamUserPassword}`;
            if (this.iamScope) {
                requestBody += `&scope=${this.iamScope}`;
            }
            const options = {
                url: `${this.iamUrl}/authorize/oauth2/token`,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Basic ${this.authorizationHeader}`,
                    Accept: 'application/json'
                },
                body: requestBody
            };
            request.post(options, (error, response, body) => {
                const tokenResponse = checkStringObject(body);
                debugLog(`tokenResponse=${tokenResponse}`);
                if (!error && response.statusCode === 200) {
                    debugLog(`IAM access token received: ${tokenResponse.access_token}`);
                    return resolve(body);
                }
                console.log(`--- getAccessTokenBody, options = ${JSON.stringify(options)}`);
                console.log(`--- getAccessTokenBody, responseBody = ${JSON.stringify(body)}, status=${response.statusCode}`);
                return reject(new Error('AccessForbiddenError: Forbidden Access'));
            });
        });
    }
    getIntrospectClientId(inputToken) {
        return new Promise((resolve, reject) => {
            let requestBody = `token=${inputToken}`;
            const options = {
                url: `${this.iamUrl}/authorize/oauth2/introspect`,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Basic ${this.introspectAuthorizationHeader}`,
                    Accept: 'application/json',
                    "cache-control": 'no-cache'
                },
                body: requestBody
            };
            request.post(options, (error, response, body) => {
                const introspectResponse = checkStringObject(body);
                debugLog(`introspectClientIdResponseBody=${body}`);
                if (!error && response.statusCode === 200) {
                    debugLog(`IAM ntrospect client received: ${introspectResponse.sub}`);
                    return resolve(introspectResponse.sub);
                }
                return reject(new Error('AccessForbiddenError: Forbidden Access'));
            });
        });
    }
}