'use strict';

const debugLog = require('debug')('info');

const request = require('request');
const common = require('./util/common');

/**
 * Get the TypeHierarchy for the given devicetype
 * @param {string} token - generated token to access MDM
 * @param {string} mdm_url - mdm url
 * @param {string} deviceType 
 * @returns object - parsed Type hierarchy
 */
function getMdmTH(token, mdm_url, deviceType) {
  const options = {
    method: 'GET',
    url: `${mdm_url}/DeviceType?name:exact=${deviceType}&_include=DeviceType:deviceGroupId&_include:recurse=DeviceGroup:applicationId&_include:recurse=Application:propositionId`,
    headers: common.buildMdmHeader(token),
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
        resolve(body);
      }
    });
  });
}

module.exports = {
  getMdmTH
};
