/*
Getting parameters from settings.json and posting CREATE Profile
*/
const debugLog = require('debug')('info');

const request = require("request");
const common = require("../common.js");

function createProfile(api_version, token, prf_url, payload) {
  let headers = common.buildHeaders(api_version, token);
  let options = {
    method: 'POST',
    url: `${prf_url}/Profile`,
    body: payload,
    headers: headers,
    json: true
  };
  debugLog(`options=${JSON.stringify(options, null, 2)}`);
  return new Promise(function (resolve, reject) {
    request(options, function (err, resp) {
      if (err) {
        debugLog(`err=${JSON.stringify(err, null, 2)}`);
        reject(err);
      } else {
        debugLog(`resp=${JSON.stringify(resp, null, 2)}`);
        resolve(resp);
      }
    })
  })
}

module.exports = {
  createProfile
}