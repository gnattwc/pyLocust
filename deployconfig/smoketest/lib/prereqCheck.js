'use strict';

const AWS = require('aws-sdk');
const { getAccessToken } = require('./authAccessToken');
const debugLog = require('debug')('prereqCheck');

function checkScope(iamUrl, deviceObj) {
  debugLog(arguments);

  return new Promise((resolve, reject) => {
    const requiredScopes = [
      // '.?.crl.cmd.sendpaired',
      // '?.?.ps.relationship.create',
      // '?.?.crl.cmd.sendpaired',
      // '?.?.crl.cmd.getany',
      // '?.?.crl.cmd.updateany',
      // '?.?.crl.cmd.deleteany',
      // '?.?.crl.cmd.subscribeown',
      '?.?.iotgw.broker.connect',
      'auth_iam_sign_token'
    ];

    getAccessToken(iamUrl, deviceObj.ClientId, deviceObj.ClientSecret, deviceObj.UserId, deviceObj.UserPassword)
      .then((respBody) => {
        debugLog(`body.scope=${respBody.scope}`);

        requiredScopes.forEach(s => {
          if (!respBody.scope.includes(s)) {
            reject(`scopeToCheck=${s} is not in hsdpId=${deviceObj.HsdpId} scope=${respBody.scope}`);
          }
        });

        resolve();
      });
  });
}

function describeThing(hsdpId, region) {
  return new Promise((resolve, reject) => {
    AWS.config.update({
      region: region
    });
    const iot = new AWS.Iot();
    const params = {
      thingName: hsdpId
    };
    iot.describeThing(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

function validateThing(hsdpId, region) {
  return new Promise((resolve, reject) => {
    describeThing(hsdpId, region)
      .then((thing) => {
        debugLog(`thing=${JSON.stringify(thing)}`);
        if (!thing) throw new Error(`Could not find thing for hsdpId=${hsdpId}`);
        resolve(thing);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

module.exports = async function prereqCheck(configObj) {
  debugLog(arguments);
  if (!configObj.Devices) throw (new Error(`configObj.Devices not found`));
  if (!configObj.DistrustDevices) throw (new Error(`configObj.DistrustDevices not found`));

  console.log(`--- Prereq Check: started`);
  console.log(`--- Trusted Devices: `);
  for (let i = 0; i < configObj.Devices.length; i++) {
    const d = configObj.Devices[i];
    console.log(`  --- Prereq Check: validateThing device ${i+1}: started`);
    await validateThing(d.HsdpId, configObj.Region);
    console.log(`  *** Prereq Check: validateThing device ${i+1}: passed`);
    console.log(`  --- Prereq Check: check scope device ${i+1}: started`);
    await checkScope(configObj.IamUrl, d);
    console.log(`  *** Prereq Check: check scope device ${i+1}: passed`);
  }
  console.log(`--- Distrusted Devices: `);
  for (let i = 0; i < configObj.DistrustDevices.length; i++) {
    const d = configObj.DistrustDevices[i];
    console.log(`  --- Prereq Check: validateThing device ${i+1}: started`);
    await validateThing(d.HsdpId, configObj.Region);
    console.log(`  *** Prereq Check: validateThing device ${i+1}: passed`);
    console.log(`  --- Prereq Check: check scope device ${i+1}: started`);
    await checkScope(configObj.IamUrl, d);
    console.log(`  *** Prereq Check: check scope device ${i+1}: passed`);
  }

}
