/*
Getting parameters from settings.json and unprovisioning a device.
*/


const debugLog = require('debug')('info');

const request = require('request');

function unprovision(provisionUrl, accessToken, deviceHSDPId) {
  const options = {
    method: 'POST',
    url: `${provisionUrl}/connect/provisioning/$unprovision`,
    body: `{
      "resourceType": "Identity",
      "identifier": {
          "system": "http://",
          "value": "${deviceHSDPId}"
      }
  }`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'api-version': 1
    }
  };
  debugLog(options);
  return new Promise(function (resolve, reject) {
    request(options, function (err, resp, body) {
      if (err) {
        debugLog("open : " + err);
        reject(err);
      } else {
        debugLog(resp.body);
        resolve(resp);
      }
    })
  })
}

module.exports.unprovision = unprovision;