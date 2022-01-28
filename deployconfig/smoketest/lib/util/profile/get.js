'use strict';

const debugLog = require('debug')('info');

const request = require('request');
const common = require('../common');

function getProfileByHsdpId(api_version, hsdpId, token, prf_url) {
  const options = {
    method: 'GET',
    url: `${prf_url}/Profile/${hsdpId}`,
    headers: common.buildHeaders(api_version, token),
    json: true
  };
  debugLog(`options=${JSON.stringify(options, null, 2)}`);
  return new Promise((resolve, reject) => {
    request.get(options, (err, resp, body) => {
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

function searchProfile(api_version, token, prf_url, query) {
  const options = {
    method: 'GET',
    url: `${prf_url}/Profile?_count=200&${query}`,
    headers: common.buildHeaders(api_version, token),
    json: true
  };
  debugLog(`options=${JSON.stringify(options, null, 2)}`);
  return new Promise((resolve, reject) => {
    request(options, (err, resp, body) => {
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

function getProfileServiceHealth(api_version, token, prf_url) {
  const options = {
    method: 'GET',
    url: `${prf_url}/health`,
    headers: common.buildHeaders(api_version, token),
    json: true
  };
  debugLog(`options=${JSON.stringify(options, null, 2)}`);
  return new Promise((resolve, reject) => {
    request.get(options, (err, resp, body) => {
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
  getProfileByHsdpId,
  searchProfile,
  getProfileServiceHealth
};
