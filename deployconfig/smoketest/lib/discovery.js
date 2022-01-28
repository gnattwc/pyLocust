'use strict';

const request = require('request');
const debugLog = require('debug')('discovery');

function mustExist(obj) {
  Object.entries(obj).forEach((e) => {
    if (!e[1]) {
      throw new Error(`missing parameter ${e[0]}`);
    }
  });
}

function parseStringObject(inputData) {
  if (typeof (inputData) === 'string') {
    try {
      return JSON.parse(inputData);
    } catch (err) {
      return {};
    }
  }
  return JSON.parse(inputData);
}

function getServices(discoveryUrl, accessToken, validateObj, apiVersion = 1) {
  debugLog('getServices(', arguments);

  mustExist({ discoveryUrl, accessToken, apiVersion });

  return new Promise((resolve, reject) => {
    const options = {
      url: `${discoveryUrl}/core/discovery/Service`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'api-version': apiVersion
      }
    };

    // return resolve(['https://profile-test.iot-hsdp.com/connect/profile']);

    request.get(options, (err, res) => {
      let result = null;
      debugLog(`err=${JSON.stringify(err)}, res=${JSON.stringify(res)}`);
      if (!err && res.statusCode === 200) {
        const bodyObj = parseStringObject(res.body);
        if (bodyObj && bodyObj.entry) {
          if (bodyObj.entry.length > 0) {
            const filtered = bodyObj.entry
              .filter(e => Object.entries(validateObj)
                .every(v => (v[0] in e.resource && v[1] === e.resource[v[0]])));
            if (filtered.length > 0) {
              debugLog('filtered=', filtered);
              result = filtered[0].resource.urls;
              debugLog('urls', result);
            }
          }
        }
        resolve(result);
      }
      reject(new Error('AccessForbiddenError: Forbidden Access'));
    });
  });
}

// const mockRes = "{\"resourceType\":\"Bundle\",\"type\":\"collection\",\"entry\":[{\"resource\":{\"resourceType\":\"Service\",\"id\":\"d6cf7e6e-8f57-4902-a161-90e7a248d20b\",\"name\":\"DisSANameb3edc4\",\"tag\":\"DisSANameb3edc4\",\"isTrusted\":true,\"urls\":[\"https://profile-alpha.iot-hsdp.com\",\"https://profile-beta.iot-hsdp.com\"],\"actions\":[\"DisSANameb3edc4\"]},\"fullUrl\":\"https://discovery-alpha.iot-hsdp.com/core/discovery/Service/d6cf7e6e-8f57-4902-a161-90e7a248d20b\"},{\"resource\":{\"resourceType\":\"Service\",\"id\":\"9e187926-4c1a-4620-8b76-5b14bfae7755\",\"name\":\"Profile\",\"tag\":\"PRF\",\"isTrusted\":true,\"urls\":[\"https://profile-dev-alpha.iot-hsdp.com/connect/profile\"],\"actions\":[\"create-profile\",\"delete-profile\",\"update-profile\"]},\"fullUrl\":\"https://discovery-alpha.iot-hsdp.com/core/discovery/Service/9e187926-4c1a-4620-8b76-5b14bfae7755\"},{\"resource\":{\"resourceType\":\"Service\",\"id\":\"a0210abf-207e-43f4-9c80-b12d20fa18c8\",\"name\":\"Provisioning-alpha\",\"tag\":\"PRV\",\"isTrusted\":true,\"urls\":[\"https://provisioning-alpha.iot-hsdp.com/connect/provisioning\"],\"actions\":[\"create-identity\",\"unprovision\"]},\"fullUrl\":\"https://discovery-alpha.iot-hsdp.com/core/discovery/Service/a0210abf-207e-43f4-9c80-b12d20fa18c8\"}]}";

module.exports = { getServices };
