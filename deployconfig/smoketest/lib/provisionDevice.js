'use strict';

const request = require('request');
const debugLog = require('debug')('provisionDevice');

function create(provisionUrl, accessToken, deviceType, serialNumber) {
  debugLog("provisionNewDevice start:",arguments);
  if (!provisionUrl) {
    throw new Error('provisionUrl is required');
  }
  if (!deviceType) {
    throw new Error('deviceType is required');
  }
  if (!accessToken) {
    throw new Error('accessToken is required');
  }
  if (!serialNumber) {
    throw new Error('serialNumber is required');
  }
  return new Promise((resolve, reject) => {
    const options = {
      url: `${provisionUrl}/connect/provisioning/$create-identity`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'api-version': 1
      },
      body: `{
            "resourceType": "Parameters",
            "parameter": [
              {
                "name": "type",
                "valueString": "${deviceType}"
              },
              {
                "name": "identityType",
                "valueString": "device"
              },
              {
                "name": "serialNo",
                "valueString": "${serialNumber}"
              }
            ]
          }`
    };
    request.post(options, (error, res, body) => {
      if (error) return reject(error);
      if (res.statusCode != 200) return reject(`bad status code=${res.statusCode}, res.body=${JSON.stringify(res.body, null, 2)}`);

      const provisionResponseBody = JSON.parse(res.body);
      const response = {}
      provisionResponseBody['parameter'].forEach(element => {
        if (element.name === 'HSDPId') {
          response.hsdpId = element.valueString;
        } else if (element.name === 'loginId') {
          response.loginId = element.valueString;
        } else if (element.name === 'password') {
          response.loginPassowrd = element.valueString;
        } else if (element.name === 'OAuthClientId') {
          response.clientId = element.valueString;
        } else if (element.name === 'OAuthClientSecret') {
          response.clientSecret = element.valueString;
        }
      });
      return resolve(response);
    });
  });
};

module.exports.create = create;