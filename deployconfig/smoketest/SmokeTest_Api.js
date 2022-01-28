'use strict';

const debugLog = require('debug')('info');
const debugDeep = require('debug')('deep');

const fs = require('fs');
const ConfigContainer = require('./lib/configContainer');
const columnify = require('columnify');
const assert = require('assert');
const validation = require('./lib/util/validation-helper');
const { getAccessToken } = require('./lib/authAccessToken');
const { getServices } = require('./lib/discovery');

const create = require('./lib/util/profile/create');
const get = require('./lib/util/profile/get');
const update = require('./lib/util/profile/update');
const dlt = require('./lib/util/profile/delete');

const fromfilepath = process.argv[2];
const rawdata = fs.readFileSync(fromfilepath);
const deployConfig = JSON.parse(rawdata);
const fromVersion = process.argv[3] || '';

// ============ start here ==============
const executionSummary = {
  applicationName: 'ConnectProfile',
  release: deployConfig.ReleaseVersion,
  environment: deployConfig.NODE_ENV,
  region: deployConfig.AWS_DEFAULT_REGION,
  startDateTime: null,
  endDateTime: null,
  overallStatus: 'n/a',
  testCaseTotal: fromVersion.startsWith('1.5') ? 26 : 24,
  testCasePassed: 0,
  testCaseFailed: 0,
  testResults: []
};

const configObj = new ConfigContainer().getConfigObj(deployConfig);
const bluegreen = process.env.DeploymentType || '';

let timeStamp = null;
let tr;
let testName = '';

const idx = 0;
let accessToken = null;
let distrustAccessToken = null;
let profileVersion = 1;
let profileCreated;
let payload_v1 = null;
let hsdpId_v1 = null;
let payload_v2 = null;
let hsdpId_v2 = null;

let profileServiceUrl = null;

async function start() {
  debugDeep(configObj);

  //
  // get access token
  //
  try {
    const accessTokenResp = await getAccessToken(configObj.IamUrl, configObj.Devices[idx].ClientId, configObj.Devices[idx].ClientSecret, configObj.Devices[idx].UserId, configObj.Devices[idx].UserPassword);
    debugLog(accessTokenResp);
    accessToken = accessTokenResp.access_token;

    const accessTokenResp2 = await getAccessToken(configObj.IamUrl, configObj.DistrustDevices[idx].ClientId, configObj.DistrustDevices[idx].ClientSecret, configObj.DistrustDevices[idx].UserId, configObj.DistrustDevices[idx].UserPassword);
    debugLog(accessTokenResp2);
    distrustAccessToken = accessTokenResp2.access_token;
  } catch (err) {
    console.log(`Error getting access token. err=${JSON.stringify(err)}`);
    throw err;
  }

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
      }
    }
  } catch (err) {
    console.log(`*** Error calling discovery service. err=${JSON.stringify(err)}`);
    throw err;
  }

  // profileServiceUrl = `https://${bluegreen}${configObj.DomainName}`;

  if (!profileServiceUrl) {
    console.log(`*** Unable to find profile service url. match=${JSON.stringify(matchObj)}`);
    throw (new Error('unable to find profile service url'));
  }

  // V1 API

  //
  // Create Profile - V1
  //
  try {
    testName = 'create Profile - v1';
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

    const newHsdpId = `hsdpIdV1${Date.now()}`;
    payload_v1 = {
      resourceType: 'Profile',
      serialNo: 'dummySerialNum',
      HSDPId: newHsdpId,
      loginId: 'dummyLoginId3',
      identityType: 'dummyIdentityType3',
      propositionName: 'dummyPropName3',
      propositionGuid: '618234df-d3c3-4af2-9521-dfdc19036180',
      applicationName: 'notavailable3',
      applicationGuid: '45164f0f-f5ca-4a72-a45d-79d0a4b19762',
      oAuthClientId: 'dummyOAuthClientId3',
      oAuthClientName: 'not available3',
      deviceGroupId: 'dummydeviceGroupId3',
      deviceGroupName: 'dummydeviceGroupName3',
      deviceTypeId: 'dummydeviceTypeId3',
      deviceTypeName: 'dummydeviceTypeName3',
      identitySignature: 'dummyIdentitySig3',
      producingOrgGuid: '449c80bb-7cb2-4b91-85df-ff2e01449a2e',
      consumingOrgGuid: '449c80bb-7cb2-4b91-85df-ff2e01449a2e'
    };
    const response = await create.createProfile(1, accessToken, profileServiceUrl, payload_v1);
    debugDeep(response);
    debugLog(response.body);
    const expectedStatusCode = 201;
    assert(response.statusCode === expectedStatusCode, `statusCode is not valid. Expected: ${expectedStatusCode} Received: ${response.statusCode}`);
    validation.prfValidation(response, payload_v1);
    hsdpId_v1 = response.body.HSDPId;

    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    console.log(`*** ${testName}: passed. duration=${tr.duration} seconds`);
    tr.status = 'passed';
    executionSummary.testCasePassed++;
  } catch (err) {
    console.log(`*** ${testName}: failed. err=${err}`);
    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    tr.status = 'failed';
    executionSummary.testCaseFailed++;
    throw err;
  }

  //
  // get profile - V1
  //
  try {
    testName = 'get profile - V1';
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
    const expectedStatusCode = 200;
    response = await get.getProfileByHsdpId(1, hsdpId_v1, accessToken, profileServiceUrl);
    debugDeep(response);
    debugLog(response.body);
    assert(response.statusCode === expectedStatusCode, `statusCode is not valid. Expected: ${expectedStatusCode} Recieved: ${response.statusCode}`);
    validation.prfValidation(response, payload_v1);

    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    console.log(`*** ${testName}: passed. duration=${tr.duration} seconds`);
    tr.status = 'passed';
    executionSummary.testCasePassed++;
  } catch (err) {
    console.log(`*** ${testName}: failed. err=${err}`);
    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    tr.status = 'failed';
    executionSummary.testCaseFailed++;
    throw err;
  }

  //
  // update CustomAttributes - V1
  //
  try {
    testName = 'update CustomAttributes - V1';
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

    const custom_attr_v1 = {
      customAttributes: [
        { name: 'calories', value: '175' },
        { name: 'breakfast', value: 'chai seed pudding' },
        { name: 'servingSize', value: '4 oz' }
      ]
    };

    const response = await update.updateProfile(1, hsdpId_v1, accessToken, profileServiceUrl, custom_attr_v1);
    debugDeep(response);
    debugLog(response.body);
    const expectedStatusCode = 200;
    assert(response.statusCode === expectedStatusCode, `statusCode is not valid. Expected: ${expectedStatusCode} Recieved: ${response.statusCode}`);
    // profileVersion += 1;
    // payload_v1.customAttributes = custom_attr_v1;
    // validation.prfValidation(response, payload_v1, `W/${profileVersion}`);
    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    console.log(`*** ${testName}: passed. duration=${tr.duration} seconds`);
    tr.status = 'passed';
    executionSummary.testCasePassed++;
  } catch (err) {
    console.log(`*** ${testName}: failed. err=${err}`);
    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    tr.status = 'failed';
    executionSummary.testCaseFailed++;
    throw err;
  }

  //
  // search profile - V1
  //
  try {
    testName = 'search profile - V1';
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
    const expectedStatusCode = 200;
    response = await get.searchProfile(1, accessToken, profileServiceUrl, `hsdpId=${hsdpId_v1}`);
    debugDeep(response);
    debugLog(response.body);
    assert(response.statusCode === expectedStatusCode, `statusCode is not valid. Expected: ${expectedStatusCode} Recieved: ${response.statusCode}`);
    assert(response.body.entry.length === 1, `${'Search count is not 1. Expected : 1' + ' Actual : '}${response.body.entry.length}`);

    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    console.log(`*** ${testName}: passed. duration=${tr.duration} seconds`);
    tr.status = 'passed';
    executionSummary.testCasePassed++;
  } catch (err) {
    console.log(`*** ${testName}: failed. err=${err}`);
    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    tr.status = 'failed';
    executionSummary.testCaseFailed++;
    throw err;
  }

  //
  // Distrust Org Devices - V1
  //

  //
  // Create Profile - Distrust Org - V1
  //
  try {
    testName = 'create Profile - Distrust Org - v1';
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

    const newHsdpId = `hsdpIdV1${Date.now()}`;
    const payload_distrust_v1 = {
      resourceType: 'Profile',
      serialNo: 'dummySerialNum',
      HSDPId: newHsdpId,
      loginId: 'dummyLoginId3',
      identityType: 'dummyIdentityType3',
      propositionName: 'dummyPropName3',
      propositionGuid: '618234df-d3c3-4af2-9521-dfdc19036180',
      applicationName: 'notavailable3',
      applicationGuid: '45164f0f-f5ca-4a72-a45d-79d0a4b19762',
      oAuthClientId: 'dummyOAuthClientId3',
      oAuthClientName: 'not available3',
      deviceGroupId: 'dummydeviceGroupId3',
      deviceGroupName: 'dummydeviceGroupName3',
      deviceTypeId: 'dummydeviceTypeId3',
      deviceTypeName: 'dummydeviceTypeName3',
      identitySignature: 'dummyIdentitySig3',
      producingOrgGuid: '449c80bb-7cb2-4b91-85df-ff2e01449a2e',
      consumingOrgGuid: '449c80bb-7cb2-4b91-85df-ff2e01449a2e'
    };
    const response = await create.createProfile(1, distrustAccessToken, profileServiceUrl, payload_distrust_v1);
    debugDeep(response);
    debugLog(response.body);
    const expectedStatusCode = 403;
    assert(response.statusCode === expectedStatusCode, `statusCode is not valid. Expected: ${expectedStatusCode} Received: ${response.statusCode}`);

    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    console.log(`*** ${testName}: passed. duration=${tr.duration} seconds`);
    tr.status = 'passed';
    executionSummary.testCasePassed++;
  } catch (err) {
    console.log(`*** ${testName}: failed. err=${err}`);
    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    tr.status = 'failed';
    executionSummary.testCaseFailed++;
    throw err;
  }

  //
  // get profile - Distrust Org - V1
  //
  try {
    testName = 'get profile - Distrust Org - V1';
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
    const expectedStatusCode = 403;
    response = await get.getProfileByHsdpId(1, hsdpId_v1, distrustAccessToken, profileServiceUrl);
    debugDeep(response);
    debugLog(response.body);
    assert(response.statusCode === expectedStatusCode, `statusCode is not valid. Expected: ${expectedStatusCode} Recieved: ${response.statusCode}`);

    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    console.log(`*** ${testName}: passed. duration=${tr.duration} seconds`);
    tr.status = 'passed';
    executionSummary.testCasePassed++;
  } catch (err) {
    console.log(`*** ${testName}: failed. err=${err}`);
    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    tr.status = 'failed';
    executionSummary.testCaseFailed++;
    throw err;
  }

  //
  // update CustomAttributes - Distrust Org - V1
  //
  try {
    testName = 'update CustomAttributes - Distrust Org - V1';
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

    const custom_attr_v1 = {
      customAttributes: [
        { name: 'calories', value: '175' },
        { name: 'breakfast', value: 'chai seed pudding' },
        { name: 'servingSize', value: '4 oz' }
      ]
    };

    const response = await update.updateProfile(1, hsdpId_v1, distrustAccessToken, profileServiceUrl, custom_attr_v1);
    debugDeep(response);
    debugLog(response.body);
    const expectedStatusCode = 403;
    assert(response.statusCode === expectedStatusCode, `statusCode is not valid. Expected: ${expectedStatusCode} Recieved: ${response.statusCode}`);

    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    console.log(`*** ${testName}: passed. duration=${tr.duration} seconds`);
    tr.status = 'passed';
    executionSummary.testCasePassed++;
  } catch (err) {
    console.log(`*** ${testName}: failed. err=${err}`);
    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    tr.status = 'failed';
    executionSummary.testCaseFailed++;
    throw err;
  }

  //
  // search profile - Distrust Org - V1
  //
  try {
    testName = 'search profile - Distrust Org - V1';
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
    const expectedStatusCode = 403;
    response = await get.searchProfile(1, distrustAccessToken, profileServiceUrl, `hsdpId=${hsdpId_v1}`);
    debugDeep(response);
    debugLog(response.body);
    assert(response.statusCode === expectedStatusCode, `statusCode is not valid. Expected: ${expectedStatusCode} Recieved: ${response.statusCode}`);

    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    console.log(`*** ${testName}: passed. duration=${tr.duration} seconds`);
    tr.status = 'passed';
    executionSummary.testCasePassed++;
  } catch (err) {
    console.log(`*** ${testName}: failed. err=${err}`);
    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    tr.status = 'failed';
    executionSummary.testCaseFailed++;
    throw err;
  }

  //
  // delete profile V1
  //
  try {
    const testName = 'delete Profile v1';
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

    const response = await dlt.deleteProfileByHsdpId(1, hsdpId_v1, accessToken, profileServiceUrl);
    debugDeep(response.body);
    const expectedStatusCode = 200;
    assert(response.statusCode === expectedStatusCode, `statusCode is not valid. Expected: ${expectedStatusCode} Recieved: ${response.statusCode}`);

    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    console.log(`*** ${testName}: passed. duration=${tr.duration} seconds`);
    tr.status = 'passed';
    executionSummary.testCasePassed++;
  } catch (err) {
    console.log(`*** ${testName}: failed. err=${err}`);
    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    tr.status = 'failed';
    executionSummary.testCaseFailed++;
    throw err;
  }

  //
  // delete profile - Distrust Org - V1
  //
  try {
    const testName = 'delete Profile - Distrust Org - v1';
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

    const response = await dlt.deleteProfileByHsdpId(1, hsdpId_v1, distrustAccessToken, profileServiceUrl);
    debugDeep(response.body);
    const expectedStatusCode = 403;
    assert(response.statusCode === expectedStatusCode, `statusCode is not valid. Expected: ${expectedStatusCode} Recieved: ${response.statusCode}`);

    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    console.log(`*** ${testName}: passed. duration=${tr.duration} seconds`);
    tr.status = 'passed';
    executionSummary.testCasePassed++;
  } catch (err) {
    console.log(`*** ${testName}: failed. err=${err}`);
    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    tr.status = 'failed';
    executionSummary.testCaseFailed++;
    throw err;
  }

  // V2 API

  //
  // Create Profile - V2
  //
  try {
    testName = 'create Profile - v2';
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

    const deviceTH = configObj.DeviceTypeHierarchy;
    const newHsdpId = `hsdpIdV2${Date.now()}`;
    payload_v2 = {
      resourceType: 'Profile',
      serialNo: 'dummySerialNum',
      HSDPId: newHsdpId,
      loginId: 'dummyLoginId3',
      identityType: 'dummyIdentityType3',
      oAuthClientId: 'dummyOAuthClientId3',
      oAuthClientName: 'not available3',
      identitySignature: 'dummyIdentitySig3',
      applicationName: deviceTH[0].applicationName,
      applicationGuid: deviceTH[0].applicationGuid,
      propositionGuid: deviceTH[0].propositionGuid,
      propositionName: deviceTH[0].propositionName,
      deviceGroupName: deviceTH[0].deviceGroupName,
      deviceGroupId: deviceTH[0].deviceGroupId,
      deviceTypeName: deviceTH[0].deviceTypeName,
      deviceTypeId: deviceTH[0].deviceTypeId,
      producingOrgGuid: deviceTH[0].producingOrgGuid,
      consumingOrgGuid: deviceTH[0].consumingOrgGuid
    };
    debugLog('payload=', payload_v2);
    const response = await create.createProfile(2, accessToken, profileServiceUrl, payload_v2);
    debugDeep(response);
    debugLog('body=', response.body);
    const expectedStatusCode = 201;
    assert(response.statusCode === expectedStatusCode, `statusCode is not valid. Expected: ${expectedStatusCode} Received: ${response.statusCode}`);
    validation.prfValidation(response, payload_v2, 'W/1', 2, fromVersion);
    hsdpId_v2 = response.body.HSDPId;
    profileCreated = new Date(response.body.meta.lastUpdated);
    profileVersion = 1;

    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    console.log(`*** ${testName}: passed. duration=${tr.duration} seconds`);
    tr.status = 'passed';
    executionSummary.testCasePassed++;
  } catch (err) {
    console.log(`*** ${testName}: failed. err=${err}`);
    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    tr.status = 'failed';
    executionSummary.testCaseFailed++;
    throw err;
  }

  //
  // get profile - V2
  //
  try {
    testName = 'get profile - V2';
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

    const expectedStatusCode = 200;
    const response = await get.getProfileByHsdpId(2, hsdpId_v2, accessToken, profileServiceUrl);
    debugDeep(response);
    debugLog(response.body);
    assert(response.statusCode === expectedStatusCode, `statusCode is not valid. Expected: ${expectedStatusCode} Recieved: ${response.statusCode}`);
    validation.prfValidation(response, payload_v2, 'W/1', 2, fromVersion);

    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    console.log(`*** ${testName}: passed. duration=${tr.duration} seconds`);
    tr.status = 'passed';
    executionSummary.testCasePassed++;
  } catch (err) {
    console.log(`*** ${testName}: failed. err=${err}`);
    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    tr.status = 'failed';
    executionSummary.testCaseFailed++;
    throw err;
  }


  //
  // update CustomAttributes - V2
  //
  try {
    testName = 'update CustomAttributes - V2';
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

    const custom_attr_v2 = {
      calories: '175',
      breakfast: 'chai seed pudding',
      servingSize: '4 oz'
    };

    const response = await update.updateProfile(2, hsdpId_v2, accessToken, profileServiceUrl, custom_attr_v2, profileVersion);
    debugDeep(response);
    debugLog('headers=', response.headers);
    const expectedStatusCode = 200;
    assert(response.statusCode === expectedStatusCode, `statusCode is not valid. Expected: ${expectedStatusCode} Recieved: ${response.statusCode}`);
    profileVersion += 1;
    // payload_v2.customAttributes = custom_attr_v2;
    // validation.prfValidation(response, payload_v2, `W/${profileVersion}`, 2);
    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    console.log(`*** ${testName}: passed. duration=${tr.duration} seconds`);
    tr.status = 'passed';
    executionSummary.testCasePassed++;
  } catch (err) {
    console.log(`*** ${testName}: failed. err=${err}`);
    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    tr.status = 'failed';
    executionSummary.testCaseFailed++;
    throw err;
  }

  //
  // update FirmwareAttributes - V2
  //
  try {
    testName = 'update FirmwareAttributes - V2';
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

    const firmware_attr_v2 = [
      {
        firmwareComponentId: 'opsSmokeTestCompId',
        firmwareComponentName: 'myFirmwareCompdemo',
        firmwareVersionId: '40d0fb1a-1c10-4326-9e25-b82813d64f7f',
        firmwareVersionName: 'OpsSmokeTestVersion1',
        effectiveDate: '2019-11-02T17:30:36.354Z',
        downloadedDate: '2019-11-01T17:30:36.354Z',
        status: 'downloaded'
      }
    ];

    const response = await update.updateFirmwares(2, hsdpId_v2, accessToken, profileServiceUrl, firmware_attr_v2, profileVersion);
    debugDeep(response);
    debugLog('headers=', response.headers);
    const expectedStatusCode = 200;
    assert(response.statusCode === expectedStatusCode, `statusCode is not valid. Expected: ${expectedStatusCode} Recieved: ${response.statusCode}`);
    profileVersion += 1;
    // payload_v2.firmwares = firmware_attr_v2;
    // validation.prfValidation(response, payload_v2, `W/${profileVersion}`, 2);
    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    console.log(`*** ${testName}: passed. duration=${tr.duration} seconds`);
    tr.status = 'passed';
    executionSummary.testCasePassed++;
  } catch (err) {
    console.log(`*** ${testName}: failed. err=${err}`);
    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    tr.status = 'failed';
    executionSummary.testCaseFailed++;
    throw err;
  }

  // Execute new API's test only after the deploy
  if (fromVersion && fromVersion.startsWith('1.5')) {
    //
    // update ConnectionStatus - V2
    //
    try {
      testName = 'update ConnectionStatus - V2';
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

      const newStatus = 'connected';
      const updconnstatusAttrV2 = {
        status: newStatus,
        // sometimes the profile creation time is later than the updateConnStatus time even at this point after updates
        //    - likely RDS's time is ahead of test server's time
        lastUpdated: (timeStamp < profileCreated) ? profileCreated.toISOString() : timeStamp.toISOString()
      };

      const response = await update.updateConnStatus(2, hsdpId_v2, accessToken, profileServiceUrl, updconnstatusAttrV2, profileVersion);
      debugDeep(response);
      debugLog('headers=', response.headers);
      const expectedStatusCode = 200;
      assert(response.statusCode === expectedStatusCode, `statusCode is not valid. Expected: ${expectedStatusCode} Recieved: ${response.statusCode}`);
      profileVersion += 1;

      tr.duration = `${(new Date() - timeStamp) / 1000}s`;
      console.log(`*** ${testName}: passed. duration=${tr.duration} seconds`);
      tr.status = 'passed';
      executionSummary.testCasePassed++;
    } catch (err) {
      console.log(`*** ${testName}: failed. err=${err}`);
      tr.duration = `${(new Date() - timeStamp) / 1000}s`;
      tr.status = 'failed';
      executionSummary.testCaseFailed++;
      throw err;
    }

    //
    // get health - V2
    //
    try {
      testName = 'get health - V2';
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
      const expectedStatusCode = 200;
      response = await get.getProfileServiceHealth(2, accessToken, profileServiceUrl);
      debugDeep(response);
      debugLog(response.body);
      assert(response.statusCode === expectedStatusCode, `statusCode is not valid. Expected: ${expectedStatusCode} Recieved: ${response.statusCode}`);

      tr.duration = `${(new Date() - timeStamp) / 1000}s`;
      console.log(`*** ${testName}: passed. duration=${tr.duration} seconds`);
      tr.status = 'passed';
      executionSummary.testCasePassed++;
    } catch (err) {
      console.log(`*** ${testName}: failed. err=${err}`);
      tr.duration = `${(new Date() - timeStamp) / 1000}s`;
      tr.status = 'failed';
      executionSummary.testCaseFailed++;
      throw err;
    }
  }

  //
  // search profile Basic - V2
  //
  try {
    testName = 'search profile Basic - V2';
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
    const expectedStatusCode = 200;
    response = await get.searchProfile(2, accessToken, profileServiceUrl, `hsdpId=${hsdpId_v2}`);
    debugDeep(response);
    debugLog(response.body);
    assert(response.statusCode === expectedStatusCode, `statusCode is not valid. Expected: ${expectedStatusCode} Recieved: ${response.statusCode}`);
    assert(response.body.entry.length === 1, `${'Search count is not 1. Expected : 1' + ' Actual : '}${response.body.entry.length}`);

    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    console.log(`*** ${testName}: passed. duration=${tr.duration} seconds`);
    tr.status = 'passed';
    executionSummary.testCasePassed++;
  } catch (err) {
    console.log(`*** ${testName}: failed. err=${err}`);
    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    tr.status = 'failed';
    executionSummary.testCaseFailed++;
    throw err;
  }

  //
  // search profile CustomQuery - V2
  //
  try {
    testName = 'search profile CustomQuery - V2';
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
    const expectedStatusCode = 200;
    response = await get.searchProfile(2, accessToken, profileServiceUrl, 'customAttributes.calories=175&firmwares.status=downloaded');
    //  debugDeep(response);
    debugLog(response.body);
    assert(response.statusCode === expectedStatusCode, `statusCode is not valid. Expected: ${expectedStatusCode} Recieved: ${response.statusCode}`);
    assert(response.body.entry.length > 0, `${'Search count is not Valid. Expected : atleast 1' + ' Actual : '}${response.body.entry.length}`);

    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    console.log(`*** ${testName}: passed. duration=${tr.duration} seconds`);
    tr.status = 'passed';
    executionSummary.testCasePassed++;
  } catch (err) {
    console.log(`*** ${testName}: failed. err=${err}`);
    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    tr.status = 'failed';
    executionSummary.testCaseFailed++;
    throw err;
  }

  //
  // Create Profile - Distrust Org - V2
  //
  try {
    testName = 'create Profile - Distrust Org - v2';
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

    const newHsdpId = `hsdpIdV2${Date.now()}`;
    payload_v2 = {
      resourceType: 'Profile',
      serialNo: 'dummySerialNum',
      HSDPId: newHsdpId,
      loginId: 'dummyLoginId3',
      identityType: 'dummyIdentityType3',
      propositionName: 'dummyPropName3',
      propositionGuid: '618234df-d3c3-4af2-9521-dfdc19036180',
      applicationName: 'notavailable3',
      applicationGuid: '45164f0f-f5ca-4a72-a45d-79d0a4b19762',
      oAuthClientId: 'dummyOAuthClientId3',
      oAuthClientName: 'not available3',
      deviceGroupId: 'dummydeviceGroupId3',
      deviceGroupName: 'dummydeviceGroupName3',
      deviceTypeId: 'dummydeviceTypeId3',
      deviceTypeName: 'dummydeviceTypeName3',
      identitySignature: 'dummyIdentitySig3',
      producingOrgGuid: '449c80bb-7cb2-4b91-85df-ff2e01449a2e',
      consumingOrgGuid: '449c80bb-7cb2-4b91-85df-ff2e01449a2e'
    };
    const response = await create.createProfile(2, distrustAccessToken, profileServiceUrl, payload_v2);
    debugDeep(response);
    debugLog(response.body);
    const expectedStatusCode = 403;
    assert(response.statusCode === expectedStatusCode, `statusCode is not valid. Expected: ${expectedStatusCode} Received: ${response.statusCode}`);

    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    console.log(`*** ${testName}: passed. duration=${tr.duration} seconds`);
    tr.status = 'passed';
    executionSummary.testCasePassed++;
  } catch (err) {
    console.log(`*** ${testName}: failed. err=${err}`);
    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    tr.status = 'failed';
    executionSummary.testCaseFailed++;
    throw err;
  }

  //
  // get profile - Distrust Org - V2
  //
  try {
    testName = 'get profile - Distrust Org - V2';
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
    const expectedStatusCode = 403;
    response = await get.getProfileByHsdpId(2, hsdpId_v2, distrustAccessToken, profileServiceUrl);
    debugDeep(response);
    debugLog(response.body);
    assert(response.statusCode === expectedStatusCode, `statusCode is not valid. Expected: ${expectedStatusCode} Recieved: ${response.statusCode}`);

    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    console.log(`*** ${testName}: passed. duration=${tr.duration} seconds`);
    tr.status = 'passed';
    executionSummary.testCasePassed++;
  } catch (err) {
    console.log(`*** ${testName}: failed. err=${err}`);
    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    tr.status = 'failed';
    executionSummary.testCaseFailed++;
    throw err;
  }

  //
  // update CustomAttributes - Distrust Org - V2
  //
  try {
    testName = 'update CustomAttributes - Distrust Org - V2';
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

    const custom_attr_v2 = {
      calories: '175',
      breakfast: 'chai seed pudding',
      servingSize: '4 oz'
    };

    const response = await update.updateProfile(2, hsdpId_v2, distrustAccessToken, profileServiceUrl, custom_attr_v2, profileVersion);
    debugDeep(response);
    debugLog(response.body);
    const expectedStatusCode = 403;
    assert(response.statusCode === expectedStatusCode, `statusCode is not valid. Expected: ${expectedStatusCode} Recieved: ${response.statusCode}`);

    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    console.log(`*** ${testName}: passed. duration=${tr.duration} seconds`);
    tr.status = 'passed';
    executionSummary.testCasePassed++;
  } catch (err) {
    console.log(`*** ${testName}: failed. err=${err}`);
    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    tr.status = 'failed';
    executionSummary.testCaseFailed++;
    throw err;
  }

  //
  // update FirmwareAttributes - Distrust Org - V2
  //
  try {
    testName = 'update FirmwareAttributes - Distrust Org - V2';
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

    const firmware_attr_v2 = [
      {
        firmwareComponentId: 'opsSmokeTestCompId',
        firmwareComponentName: 'myFirmwareCompdemo',
        firmwareVersionId: '40d0fb1a-1c10-4326-9e25-b82813d64f7f',
        firmwareVersionName: 'OpsSmokeTestVersion1',
        effectiveDate: '2019-11-02T17:30:36.354Z',
        downloadedDate: '2019-11-01T17:30:36.354Z',
        status: 'downloaded'
      }
    ];

    const response = await update.updateFirmwares(2, hsdpId_v2, distrustAccessToken, profileServiceUrl, firmware_attr_v2, profileVersion);
    debugDeep(response);
    debugLog(response.body);
    const expectedStatusCode = 403;
    assert(response.statusCode === expectedStatusCode, `statusCode is not valid. Expected: ${expectedStatusCode} Recieved: ${response.statusCode}`);

    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    console.log(`*** ${testName}: passed. duration=${tr.duration} seconds`);
    tr.status = 'passed';
    executionSummary.testCasePassed++;
  } catch (err) {
    console.log(`*** ${testName}: failed. err=${err}`);
    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    tr.status = 'failed';
    executionSummary.testCaseFailed++;
    throw err;
  }

  //
  // search profile Basic - Distrust Org - V2
  //
  try {
    testName = 'search profile Basic - Distrust Org - V2';
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
    const expectedStatusCode = 403;
    response = await get.searchProfile(2, distrustAccessToken, profileServiceUrl, `hsdpId=${hsdpId_v2}`);
    debugDeep(response);
    debugLog(response.body);
    assert(response.statusCode === expectedStatusCode, `statusCode is not valid. Expected: ${expectedStatusCode} Recieved: ${response.statusCode}`);

    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    console.log(`*** ${testName}: passed. duration=${tr.duration} seconds`);
    tr.status = 'passed';
    executionSummary.testCasePassed++;
  } catch (err) {
    console.log(`*** ${testName}: failed. err=${err}`);
    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    tr.status = 'failed';
    executionSummary.testCaseFailed++;
    throw err;
  }

  //
  // search profile CustomQuery - Distrust Org - V2
  //
  try {
    testName = 'search profile CustomQuery - Distrust Org - V2';
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
    const expectedStatusCode = 403;
    response = await get.searchProfile(2, distrustAccessToken, profileServiceUrl, 'customAttributes.calories=175&firmwares.status=downloaded');
    //  debugDeep(response);
    debugLog(response.body);
    assert(response.statusCode === expectedStatusCode, `statusCode is not valid. Expected: ${expectedStatusCode} Recieved: ${response.statusCode}`);

    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    console.log(`*** ${testName}: passed. duration=${tr.duration} seconds`);
    tr.status = 'passed';
    executionSummary.testCasePassed++;
  } catch (err) {
    console.log(`*** ${testName}: failed. err=${err}`);
    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    tr.status = 'failed';
    executionSummary.testCaseFailed++;
    throw err;
  }

  //
  // delete profile V2
  //
  try {
    const testName = 'delete Profile v2';
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

    const response = await dlt.deleteProfileByHsdpId(2, hsdpId_v2, accessToken, profileServiceUrl);
    debugDeep(response.body);
    const expectedStatusCode = 200;
    assert(response.statusCode === expectedStatusCode, `statusCode is not valid. Expected: ${expectedStatusCode} Recieved: ${response.statusCode}`);

    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    console.log(`*** ${testName}: passed. duration=${tr.duration} seconds`);
    tr.status = 'passed';
    executionSummary.testCasePassed++;
  } catch (err) {
    console.log(`*** ${testName}: failed. err=${err}`);
    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    tr.status = 'failed';
    executionSummary.testCaseFailed++;
    throw err;
  }

  //
  // delete profile - Distrust Org - V2
  //
  try {
    const testName = 'delete Profile - Distrust Org - v2';
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

    const response = await dlt.deleteProfileByHsdpId(2, hsdpId_v2, distrustAccessToken, profileServiceUrl);
    debugDeep(response.body);
    const expectedStatusCode = 403;
    assert(response.statusCode === expectedStatusCode, `statusCode is not valid. Expected: ${expectedStatusCode} Recieved: ${response.statusCode}`);

    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    console.log(`*** ${testName}: passed. duration=${tr.duration} seconds`);
    tr.status = 'passed';
    executionSummary.testCasePassed++;
  } catch (err) {
    console.log(`*** ${testName}: failed. err=${err}`);
    tr.duration = `${(new Date() - timeStamp) / 1000}s`;
    tr.status = 'failed';
    executionSummary.testCaseFailed++;
    throw err;
  }
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
console.log('=========================================');
console.log(`==== ${executionSummary.applicationName} ${executionSummary.release} Smoke test suite`);
console.log(`---- started ${executionSummary.startDateTime.toISOString()}`);
console.log(`**** IotEndpoint=${configObj.IotEndpoint}`);
console.log(`**** IamServiceUrl=${configObj.IamUrl}`);

start()
  .then(() => {
    console.log(`**** ProfileServiceUrl=${profileServiceUrl}`);
    console.log('=========================================');
    executionSummary.endDateTime = new Date();
    executionSummary.overallStatus = 'Passed';
    printExecutionSummary(executionSummary);
  })
  .catch((err) => {
    console.log(`**** ProfileServiceUrl=${profileServiceUrl}`);
    console.log('=========================================');
    console.log(err);
    executionSummary.endDateTime = new Date();
    executionSummary.overallStatus = 'Failed';
    printExecutionSummary(executionSummary);
    console.error('process exits with errorcode=1');
    process.exit(1);
  });
