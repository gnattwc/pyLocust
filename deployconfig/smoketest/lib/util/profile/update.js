'use strict';

const debugLog = require('debug')('info');

const request = require('request');
const common = require('../common');

/**
 * helper function to setup $update-iamattributes call
 * @param {integer} apiVersion - api-version in header
 * @param {string} hsdpId - hsdpId of profile
 * @param {string} token - iam access token
 * @param {string} prfUrl - profile url
 * @param {object} payload - body payload
 * @param {integer} profileVersion - if-Match version
 * @returns request response
 */
function updateIAMattributes(apiVersion, hsdpId, token, prfUrl, payload, profileVersion) {
  const options = {
    method: 'PUT',
    url: `${prfUrl}/Profile/${hsdpId}/$update-iamattributes`,
    headers: common.buildHeaders(apiVersion, token, `W/${profileVersion}`),
    body: payload,
    json: true
  };
  debugLog(`options=${JSON.stringify(options, null, 2)}`);
  // console.log(options)
  return new Promise((resolve, reject) => {
    request(options, (err, resp) => {
      if (err) {
        reject(err);
      } else {
        debugLog(`resp=${JSON.stringify(resp, null, 2)}`);
        resolve(resp);
      }
    });
  });
}

/**
 * helper function to setup $update-customattributes call
 * @param {integer} apiVersion - api-version in header
 * @param {string} hsdpId - hsdpId of profile
 * @param {string} token - iam access token
 * @param {string} prfUrl - profile url
 * @param {object} payload - body payload
 * @param {integer} profileVersion - if-Match version
 * @returns request response
 */
function updateProfile(apiVersion, hsdpId, token, prfUrl, payload, profileVersion) {
  const options = {
    method: 'PUT',
    url: `${prfUrl}/Profile/${hsdpId}/$update-customattributes`,
    headers: common.buildHeaders(apiVersion, token, `W/${profileVersion}`),
    body: payload,
    json: true
  };
  debugLog(`options=${JSON.stringify(options, null, 2)}`);
  // console.log(options);
  return new Promise((resolve, reject) => {
    request(options, (err, resp) => {
      if (err) {
        reject(err);
      } else {
        debugLog(`resp=${JSON.stringify(resp, null, 2)}`);
        resolve(resp);
      }
    });
  });
}

/**
 * helper function to setup $update-firmwares call
 * @param {integer} apiVersion - api-version in header
 * @param {string} hsdpId - hsdpId of profile
 * @param {string} token - iam access token
 * @param {string} prfUrl - profile url
 * @param {object} payload - body payload
 * @param {integer} profileVersion - if-Match version
 * @returns request response
 */
function updateFirmwares(apiVersion, hsdpId, token, prfUrl, payload, profileVersion) {
  const options = {
    method: 'PUT',
    url: `${prfUrl}/Profile/${hsdpId}/$update-firmwares`,
    headers: common.buildHeaders(apiVersion, token, `W/${profileVersion}`),
    body: payload,
    json: true
  };
  debugLog(`options=${JSON.stringify(options, null, 2)}`);
  return new Promise((resolve, reject) => {
    request(options, (err, resp) => {
      if (err) {
        reject(err);
      } else {
        debugLog(`resp=${JSON.stringify(resp, null, 2)}`);
        resolve(resp);
      }
    });
  });
}

/**
 * helper function to setup $update-connectionstatus call
 * @param {integer} apiVersion - api-version in header
 * @param {string} hsdpId - hsdpId of profile
 * @param {string} token - iam access token
 * @param {string} prfUrl - profile url
 * @param {object} payload - body payload
 * @param {integer} profileVersion - if-Match version
 * @returns request response
 */
function updateConnStatus(apiVersion, hsdpId, token, prfUrl, payload, profileVersion) {
  const options = {
    method: 'PUT',
    url: `${prfUrl}/Profile/${hsdpId}/$update-connectionstatus`,
    headers: common.buildHeaders(apiVersion, token, `W/${profileVersion}`),
    body: payload,
    json: true
  };
  debugLog(`options=${JSON.stringify(options, null, 2)}`);
  return new Promise((resolve, reject) => {
    request(options, (err, resp) => {
      if (err) {
        debugLog(`err=${JSON.stringify(err, null, 2)}`);
        reject(err);
      } else {
        debugLog(`resp=${JSON.stringify(resp, null, 2)}`);
        resolve(resp);
      }
    });
  });
}

module.exports = {
  updateProfile,
  updateIAMattributes,
  updateFirmwares,
  updateConnStatus
};
