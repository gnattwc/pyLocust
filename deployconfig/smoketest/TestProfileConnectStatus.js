'use strict'

const debugLog = require('debug')('info');
const debugDeep = require('debug')('deep');

const fs = require('fs');
const ConfigContainer = require('./lib/configContainer');
const prereqCheck = require('./lib/prereqCheck');
const connect = require('./lib/util/mqtt-connect');
const getProfile = require('./lib/util/profile/get');
const updateProfile = require('./lib/util/profile/update');
const unprovision = require('./lib/util/profile/unprovision');
const columnify = require('columnify');
const assert = require('assert');
const common = require('./lib/util/common');
const { getAccessToken } = require('./lib/authAccessToken');
const { getServices } = require('./lib/discovery');

const fromfilepath = process.argv[2];
let rawdata = fs.readFileSync(fromfilepath);
let deployConfig = JSON.parse(rawdata);

// ============ start here ==============
const executionSummary = {
  applicationName: 'ConnectProfile',
  release: deployConfig.ReleaseVersion,
  environment: deployConfig.NODE_ENV,
  region: deployConfig.AWS_DEFAULT_REGION,
  startDateTime: null,
  endDateTime: null,
  overallStatus: 'n/a',
  testCaseTotal: 12,
  testCasePassed: 0,
  testCaseFailed: 0,
  testResults: []
};

const configObj = new ConfigContainer().getConfigObj(deployConfig);
const bluegreen = process.env.DeploymentType || '';

let timeStamp = null;
let tr;
let testName = "";

let idx = 0;
let profileDevice = null;
let accessToken = null;
let permaccessToken = null;
let profileVersion = 1;
let payload = null;

// default profile url
let profileServiceUrl = null;

async function start() {
  debugDeep(configObj);

  //
  // prereq check
  //
  try {
    timeStamp = new Date();
    testName = 'Prereq Check';
    console.log(`*** ${testName}: starting`);
    tr = {
      name: 'prerequisite Check',
      status: 'executing',
      time: timeStamp.toISOString(),
      duration: 0,
      endpoint: 'n/a'
    };
    executionSummary.testResults.push(tr);

    if (configObj.Devices.length < 1) throw new Error('need 1 device provisioned');
    await prereqCheck(configObj);

    console.log(`*** ${testName}: passed. duration=${tr['duration']} seconds`);
    tr['duration'] = `${(new Date() - timeStamp) / 1000}s`;
    tr['status'] = 'passed';
    executionSummary.testCasePassed++;
  } catch (err) {
    console.log(`*** ${testName}: failed. err=${err}`);
    tr['duration'] = `${(new Date() - timeStamp) / 1000}s`;
    tr['status'] = 'failed';
    executionSummary.testCaseFailed++;
    throw err;
  };

  //
  // get access token
  //
  try {
    testName = 'get access token';
    timeStamp = new Date();
    console.log(`*** ${testName}: starting`);
    tr = {
      name: testName,
      status: 'executing',
      time: timeStamp.toISOString(),
      duration: 0,
      endpoint: configObj.IamUrl
    };
    executionSummary.testResults.push(tr);

    const accessTokenResp = await getAccessToken(configObj.IamUrl, configObj.Devices[idx].ClientId, configObj.Devices[idx].ClientSecret, configObj.Devices[idx].UserId, configObj.Devices[idx].UserPassword);
    debugLog(accessTokenResp.body);
    accessToken = accessTokenResp.access_token;

    tr['duration'] = `${(new Date() - timeStamp) / 1000}s`;
    console.log(`*** ${testName}: passed. duration=${tr['duration']} seconds`);
    tr['status'] = 'passed';
    executionSummary.testCasePassed++;
  } catch (err) {
    console.log(`*** ${testName}: failed. err=${err}`);
    tr['duration'] = `${(new Date() - timeStamp) / 1000}s`;
    tr['status'] = 'failed';
    executionSummary.testCaseFailed++;
    throw err;
  };

  try {
    testName = 'get permaccess token';
    timeStamp = new Date();
    console.log(`*** ${testName}: starting`);
    tr = {
      name: testName,
      status: 'executing',
      time: timeStamp.toISOString(),
      duration: 0,
      endpoint: configObj.IotEndpoint
    };
    executionSummary.testResults.push(tr);

    const permaccessTokenResp = await getAccessToken(configObj.IamUrl, configObj.Devices[idx].ClientId, configObj.Devices[idx].ClientSecret, configObj.UserName, configObj.UserPwd);
    debugLog(permaccessTokenResp.body);
    permaccessToken = permaccessTokenResp.access_token;

    tr['duration'] = `${(new Date() - timeStamp) / 1000}s`;
    console.log(`*** ${testName}: passed. duration=${tr['duration']} seconds`);
    tr['status'] = 'passed';
    executionSummary.testCasePassed++;
  } catch (err) {
    console.log(`*** ${testName}: failed. err=${err}`);
    tr['duration'] = `${(new Date() - timeStamp) / 1000}s`;
    tr['status'] = 'failed';
    executionSummary.testCaseFailed++;
    throw err;
  };

  //
  // get profile url through discovery service
  //
  const matchObj = { name: configObj.DscProfileName };
  try {
    const urls = await getServices(configObj.DiscoveryUrl, accessToken, matchObj);
    debugLog(JSON.stringify(urls));

    if (urls && urls.length > 0) {
      const splitted = urls[0].split('https://');
      if (splitted.length > 1) {
        profileServiceUrl = `https://${bluegreen}${splitted[1]}`;
        console.log(`profileServiceUrl=${profileServiceUrl}`);
      }
    }
  } catch (err) {
    console.log(`Error calling discovery service. err=${JSON.stringify(err)}`);
    throw err;
  };

  // profileServiceUrl = `https://${bluegreen}${configObj.DomainName}`;

  if (!profileServiceUrl) {
    console.log(`*** Unable to find profile service url. match=${JSON.stringify(matchObj)}`);
    throw (new Error('unable to find profile service url'));
  }

  //
  // get profile with not connected status - verify Notification Handler
  //
  try {
    testName = 'get profile - not connected - verify Notification Handler';
    timeStamp = new Date();
    console.log(`*** ${testName}: starting`);
    tr = {
      name: testName,
      status: 'executing',
      time: timeStamp.toISOString(),
      duration: 0,
      endpoint: profileServiceUrl
    };
    executionSummary.testResults.push(tr);

    let response;
    let counter = 0;
    const expectedStatusCode = 200;
    while (counter < 10) {
      counter += 1;
      console.log(`getProfileByHsdpId(${configObj.Devices[idx].HsdpId})`);
      response = await getProfile.getProfileByHsdpId(1, configObj.Devices[idx].HsdpId, accessToken, profileServiceUrl);
      debugLog(response.body);
      if (response.statusCode === expectedStatusCode) break;
      console.log('*** wait 10 seconds...');
      await common.sleep(10000);
    }
    assert(response.statusCode === expectedStatusCode, "statusCode is not valid. Expected: " + expectedStatusCode + " Recieved: " + response.statusCode);
    assert(response.body.connectionStatus.status !== 'connected', 'Device is already connected');

    tr['duration'] = `${(new Date() - timeStamp) / 1000}s`;
    console.log(`*** ${testName}: passed. duration=${tr['duration']} seconds`);
    tr['status'] = 'passed';
    executionSummary.testCasePassed++;
  } catch (err) {
    console.log(`*** ${testName}: failed. err=${err}`);
    tr['duration'] = `${(new Date() - timeStamp) / 1000}s`;
    tr['status'] = 'failed';
    executionSummary.testCaseFailed++;
    throw err;
  };

  //
  // connect device
  //
  try {
    testName = 'connect Device';
    timeStamp = new Date();
    console.log(`*** ${testName}: starting`);
    tr = {
      name: testName,
      status: 'executing',
      time: timeStamp.toISOString(),
      duration: 0,
      endpoint: configObj.IotEndpoint
    };
    executionSummary.testResults.push(tr);

    profileDevice = await connect.getDevice(configObj, configObj.Devices[idx]);

    tr['duration'] = `${(new Date() - timeStamp) / 1000}s`;
    console.log(`*** ${testName}: passed. duration=${tr['duration']} seconds`);
    tr['status'] = 'passed';
    executionSummary.testCasePassed++;
  } catch (err) {
    console.log(`*** ${testName}: failed. err=${err}`);
    tr['duration'] = `${(new Date() - timeStamp) / 1000}s`;
    tr['status'] = 'failed';
    executionSummary.testCaseFailed++;
    throw err;
  };

  //
  // wait 5s
  console.log('*** wait 5 seconds...');
  await common.sleep(5000);

  //
  // get profile - connected
  //
  try {
    testName = 'get profile - connected';
    timeStamp = new Date();
    console.log(`*** ${testName}: starting`);
    tr = {
      name: testName,
      status: 'executing',
      time: timeStamp.toISOString(),
      duration: 0,
      endpoint: profileServiceUrl
    };
    executionSummary.testResults.push(tr);

    const accessTokenResp = await getAccessToken(configObj.IamUrl, configObj.Devices[idx].ClientId, configObj.Devices[idx].ClientSecret, configObj.Devices[idx].UserId, configObj.Devices[idx].UserPassword);
    debugLog(accessTokenResp);
    accessToken = accessTokenResp.access_token;

    let response;
    let counter = 0;
    const expectedStatusCode = 200;
    while (counter < 10) {
      counter += 1;
      debugLog(`getProfileByHsdpId(${configObj.Devices[idx].HsdpId},${profileServiceUrl})`);
      response = await getProfile.getProfileByHsdpId(1, configObj.Devices[idx].HsdpId, accessToken, profileServiceUrl);
      //  debugDeep(response);
      debugLog(response.body);
      if (response.body.connectionStatus.status == 'connected') break;
      console.log('*** wait 10 seconds...');
      await common.sleep(10000);
    }
    assert(response.statusCode === expectedStatusCode, "statusCode is not valid. Expected: " + expectedStatusCode + " Recieved: " + response.statusCode);
    assert(response.body.connectionStatus.status == 'connected', `Connection status is not connected.  actual=${response.body.connectionStatus.status}`);

    tr['duration'] = `${(new Date() - timeStamp) / 1000}s`;
    console.log(`*** ${testName}: passed. duration=${tr['duration']} seconds`);
    tr['status'] = 'passed';
    executionSummary.testCasePassed++;
  } catch (err) {
    console.log(`*** ${testName}: failed. err=${err}`);
    tr['duration'] = `${(new Date() - timeStamp) / 1000}s`;
    tr['status'] = 'failed';
    executionSummary.testCaseFailed++;
    throw err;
  };

  //
  // disconnect device
  //
  try {
    testName = 'disconnect Device';
    timeStamp = new Date();
    console.log(`*** ${testName}: starting`);
    tr = {
      name: testName,
      status: 'executing',
      time: timeStamp.toISOString(),
      duration: 0,
      endpoint: configObj.IotEndpoint
    };
    executionSummary.testResults.push(tr);

    const disconnectPromise = new Promise((resolve, reject) => {
      profileDevice.end(false, () => {
        resolve();
      });
    });
    const msTimeout = 30000;  // reject in 30s
    const timeoutPromise = new Promise((resolve, reject) => {
      const id = setTimeout(() => {
        clearTimeout(id);
        reject('Timed out after ' + msTimeout + 'ms');
      }, msTimeout)
    });
    await Promise.race([
      disconnectPromise,
      timeoutPromise
    ]);

    tr['duration'] = `${(new Date() - timeStamp) / 1000}s`;
    console.log(`*** ${testName}: passed. duration=${tr['duration']} seconds`);
    tr['status'] = 'passed';
    executionSummary.testCasePassed++;
  } catch (err) {
    console.log(`*** ${testName}: failed. err=${err}`);
    tr['duration'] = `${(new Date() - timeStamp) / 1000}s`;
    tr['status'] = 'failed';
    executionSummary.testCaseFailed++;
    throw err;
  };

  //
  // wait 5s
  console.log('*** wait 5 seconds...');
  await common.sleep(5000);

  //
  // get profile - disconnected
  //
  try {
    testName = 'get profile - disconnected';
    timeStamp = new Date();
    console.log(`*** ${testName}: starting`);
    tr = {
      name: testName,
      status: 'executing',
      time: timeStamp.toISOString(),
      duration: 0,
      endpoint: profileServiceUrl
    };
    executionSummary.testResults.push(tr);

    const accessTokenResp = await getAccessToken(configObj.IamUrl, configObj.Devices[idx].ClientId, configObj.Devices[idx].ClientSecret, configObj.Devices[idx].UserId, configObj.Devices[idx].UserPassword);
    debugLog(accessTokenResp);
    const accessToken = accessTokenResp.access_token;

    let response;
    let counter = 0;
    const expectedStatusCode = 200;
    while (counter < 10) {
      counter += 1;
      debugLog(`getProfileByHsdpId(${configObj.Devices[idx].HsdpId},${profileServiceUrl})`);
      response = await getProfile.getProfileByHsdpId(1, configObj.Devices[idx].HsdpId, accessToken, profileServiceUrl);
      debugDeep(response);
      debugLog(response.body);
      if (response.body.connectionStatus.status == 'disconnected') break;
      console.log('*** wait 10 seconds...');
      await common.sleep(10000);
    }
    assert(response.statusCode === expectedStatusCode, "statusCode is not valid. Expected: " + expectedStatusCode + " Recieved: " + response.statusCode);
    assert(response.body.connectionStatus.status == 'disconnected', ' Connection status is not disconnected');

    tr['duration'] = `${(new Date() - timeStamp) / 1000}s`;
    console.log(`*** ${testName}: passed. duration=${tr['duration']} seconds`);
    tr['status'] = 'passed';
    executionSummary.testCasePassed++;
  } catch (err) {
    console.log(`*** ${testName}: failed. err=${err}`);
    tr['duration'] = `${(new Date() - timeStamp) / 1000}s`;
    tr['status'] = 'failed';
    executionSummary.testCaseFailed++;
    throw err;
  };

  //
  // update IamAttributes
  //
  try {
    testName = 'update IamAttributes';
    timeStamp = new Date();
    console.log(`*** ${testName}: starting`);
    tr = {
      name: testName,
      status: 'executing',
      time: timeStamp.toISOString(),
      duration: 0,
      endpoint: profileServiceUrl
    };
    executionSummary.testResults.push(tr);

    payload = {
      "isActive": true,
      "forTest": true,
      "debugUntil": "2020-02-18T12:34:56.789Z",
      "deviceExtId": {
        "type": {
          "code": "update1",
          "text": "type of d1deviceType1"
        },
        "value": "2ceb9c0c-d671-440e-acfd-98579b9a6981",
        "system": "https://idm-development.us-east.philips-healthsuite.com/"
      }
    }

    const response = await updateProfile.updateIAMattributes(2, configObj.Devices[idx].HsdpId, permaccessToken, profileServiceUrl, payload, profileVersion);
    debugDeep(response);
    const expectedStatusCode = 200;
    assert(response.statusCode === expectedStatusCode, "statusCode is not valid. Expected: " + expectedStatusCode + " Recieved: " + response.statusCode);

    tr['duration'] = `${(new Date() - timeStamp) / 1000}s`;
    console.log(`*** ${testName}: passed. duration=${tr['duration']} seconds`);
    tr['status'] = 'passed';
    executionSummary.testCasePassed++;
  } catch (err) {
    console.log(`*** ${testName}: failed. err=${err}`);
    tr['duration'] = `${(new Date() - timeStamp) / 1000}s`;
    tr['status'] = 'failed';
    executionSummary.testCaseFailed++;
    throw err;
  };

  //
  // get profile - after update iamAttributes
  //
  try {
    testName = 'get profile - after update iam';
    timeStamp = new Date();
    console.log(`*** ${testName}: starting`);
    tr = {
      name: testName,
      status: 'executing',
      time: timeStamp.toISOString(),
      duration: 0,
      endpoint: profileServiceUrl
    };
    executionSummary.testResults.push(tr);

    const response = await getProfile.getProfileByHsdpId(2, configObj.Devices[idx].HsdpId, accessToken, profileServiceUrl);
    debugDeep(response);
    const expectedStatusCode = 200;
    assert(response.statusCode === expectedStatusCode, "statusCode is not valid. Expected: " + expectedStatusCode + " Recieved: " + response.statusCode);
    // assert(JSON.stringify(sortObj(response.body.iamAttributes)) === JSON.stringify(sortObj(payload)), ' update iam failed');

    tr['duration'] = `${(new Date() - timeStamp) / 1000}s`;
    console.log(`*** ${testName}: passed. duration=${tr['duration']} seconds`);
    tr['status'] = 'passed';
    executionSummary.testCasePassed++;
  } catch (err) {
    console.log(`*** ${testName}: failed. err=${err}`);
    tr['duration'] = `${(new Date() - timeStamp) / 1000}s`;
    tr['status'] = 'failed';
    executionSummary.testCaseFailed++;
    throw err;
  };

  //
  // unprovision a device
  //
  try {
    testName = 'unprovision Device';
    timeStamp = new Date();
    console.log(`*** ${testName}: starting`);
    tr = {
      name: testName,
      status: 'executing',
      time: timeStamp.toISOString(),
      duration: 0,
      endpoint: deployConfig.SmokeTestProvisionUrl
    };
    executionSummary.testResults.push(tr);

    const response = await unprovision.unprovision(deployConfig.SmokeTestProvisionUrl, permaccessToken, configObj.Devices[idx].HsdpId);
    debugDeep(response);
    const expectedStatusCode = 204;
    assert(response.statusCode === expectedStatusCode, "statusCode is not valid. Expected: " + expectedStatusCode + " Recieved: " + response.statusCode);

    tr['duration'] = `${(new Date() - timeStamp) / 1000}s`;
    console.log(`*** ${testName}: passed. duration=${tr['duration']} seconds`);
    tr['status'] = 'passed';
    executionSummary.testCasePassed++;
  } catch (err) {
    console.log(`*** ${testName}: failed. err=${err}`);
    tr['duration'] = `${(new Date() - timeStamp) / 1000}s`;
    tr['status'] = 'failed';
    executionSummary.testCaseFailed++;
    throw err;
  };

  //
  // wait 15s
  console.log('*** wait 15 seconds...');
  await common.sleep(15000);

  //
  // get profile = not found
  //
  try {
    testName = 'getProfileByHsdpId - not found';
    timeStamp = new Date();
    console.log(`*** ${testName}: starting`);
    tr = {
      name: testName,
      status: 'executing',
      time: timeStamp.toISOString(),
      duration: 0,
      endpoint: profileServiceUrl
    };
    executionSummary.testResults.push(tr);

    let response;
    let counter = 0;
    const expectedStatusCode = 404;
    while (counter < 10) {
      counter += 1;
      console.log(`getProfileByHsdpId(${configObj.Devices[idx].HsdpId})`);
      response = await getProfile.getProfileByHsdpId(2, configObj.Devices[idx].HsdpId, permaccessToken, profileServiceUrl);
      // debugDeep(response);
      debugLog(response.body);
      if (response.statusCode === expectedStatusCode) break;
      console.log('*** wait 10 seconds...');
      await common.sleep(10000);
    }
    assert(response.statusCode === expectedStatusCode, "statusCode is not valid. Expected: " + expectedStatusCode + " Recieved: " + response.statusCode);

    tr['duration'] = `${(new Date() - timeStamp) / 1000}s`;
    console.log(`*** ${testName}: passed. duration=${tr['duration']} seconds`);
    tr['status'] = 'passed';
    executionSummary.testCasePassed++;
  } catch (err) {
    console.log(`*** ${testName}: failed. err=${err}`);
    tr['duration'] = `${(new Date() - timeStamp) / 1000}s`;
    tr['status'] = 'failed';
    executionSummary.testCaseFailed++;
    throw err;
  };

}

function printExecutionSummary(summary) {
  console.log('======================== EXECUTION SUMMARY ===========================');
  console.log(columnify(summary.testResults, { config: { duration: { align: 'right' } } }));
  console.log('');
  console.log(`APPLICATION: ${summary.applicationName}`);
  console.log(`RELEASE: ${summary.release}`);
  console.log(`ENVIRONMENT: ${summary.environment}`);
  console.log(`REGION: ${summary.region}`);
  console.log('');
  console.log('QUICK SUMMARY');
  console.log(`Execution start time: ${summary.startDateTime.toISOString()}`);
  console.log(`Execution end time: ${summary.endDateTime.toISOString()}`);
  console.log('-----------------------------------');
  console.log(`Total test cases                ${summary.testCaseTotal}`);
  console.log(`Total test cases Executed       ${summary.testCasePassed + summary.testCaseFailed}`);
  console.log(`Total test cases Passed         ${summary.testCasePassed}`);
  console.log(`Total test cases Failed         ${summary.testCaseFailed}`);
  console.log(`Total test cases Not Executed   ${summary.testCaseTotal - summary.testCasePassed - summary.testCaseFailed}`);
}

executionSummary.startDateTime = new Date();
console.log(`=========================================`);
console.log(`==== ${executionSummary.applicationName} ${executionSummary.release} Smoke test suite`);
console.log(`---- started ${executionSummary.startDateTime.toISOString()}`);
console.log(`**** IotEndpoint=${configObj.IotEndpoint}`);
console.log(`**** IamServiceUrl=${configObj.IamUrl}`);

start()
  .then(() => {
    console.log(`**** ProfileServiceUrl=${profileServiceUrl}`);
    console.log(`=========================================`);
    executionSummary.endDateTime = new Date();
    executionSummary.overallStatus = 'Passed';
    printExecutionSummary(executionSummary);
  })
  .catch(err => {
    console.log(`**** ProfileServiceUrl=${profileServiceUrl}`);
    console.log(`=========================================`);
    executionSummary.endDateTime = new Date();
    executionSummary.overallStatus = 'Failed';
    printExecutionSummary(executionSummary);
    console.error('process exits with errorcode=1');
    process.exit(1);
  });