'use strict'

const fs = require('fs');
const debugLog = require('debug')('info');

const { getSvcAccountAccessToken } = require('./lib/authAccessToken');
const getTHFromMdm = require('./lib/mdm-thget').getMdmTH;

const fromfilepath = process.argv[2];
const tofilepath = fromfilepath;
let rawdata = fs.readFileSync(fromfilepath);
let deployConfig = JSON.parse(rawdata);

/**
 * Update the TypeHierarchy in the config file
 * @param {string} devices
 * @param {object} thResource
 */
function UpdateTHConfigData(devices, thResource) {
  console.log(thResource);
  devices.push({
    applicationGuid : thResource.applicationGuid,
    applicationName : thResource.applicationName,
    propositionGuid : thResource.propositionGuid,
    propositionName : thResource.propositionName,
    producingOrgGuid : thResource.producingOrgGuid,
    consumingOrgGuid : thResource.consumingOrgGuid,
    deviceGroupName : thResource.deviceGroupName,
    deviceGroupId : thResource.deviceGroupId,
    deviceTypeId : thResource.deviceTypeId,
    deviceTypeName : thResource.deviceTypeName
  });
}

/**
 * Validate objects must exist in the config file
 * @param {object} validateObj
 */
function mustExist(validateObj) {
  Object.entries(validateObj).forEach((e) => {
    if (!e[1]) {
      throw Error(`missing ${e[0]}`);
    }
  });
}

// ============ start here ==============
async function start() {
  console.log(`========= ConnectProfile v${deployConfig.ReleaseVersion} Get TH for DeviceType: ${deployConfig.SmokeTestDeviceType}`);
  console.log(`MdmUrl=${deployConfig.MDM_URL}`);
  console.log(`SmokeTestIamUrl=${deployConfig.IAM_URL}`);

  // sanity check
  mustExist({
    IAM_URL: deployConfig.IAM_URL,
    MdmUrl: deployConfig.MDM_URL,
    SmokeTestDeviceType: deployConfig.SmokeTestDeviceType,
    Devices: deployConfig.SmokeTestDevices
  });

  //
  // get access token
  //
  let accessToken;
  try {
    // const accessTokenResp = await getAccessToken(deployConfig.IAM_URL, deployConfig.iamClientKey, deployConfig.iamClientPasswordKey, deployConfig.SmokeTestUsername, deployConfig.SmokeTestUserPwd);
    // debugLog(accessTokenResp);
    // accessToken = accessTokenResp.access_token;

    const accessTokenResp = await getSvcAccountAccessToken(deployConfig.IAM_URL, deployConfig.SvcAccountServiceId, deployConfig.SvcAccountPrivateKey);
    debugLog(accessTokenResp);
    accessToken = accessTokenResp;
  } catch (err) {
    console.log(`Error getting access token. err=${JSON.stringify(err)}`);
    throw err;
  }
  let parsedValues = {};

  try {
    const mdmTHResponse = await getTHFromMdm(accessToken, deployConfig.MDM_URL, deployConfig.SmokeTestDeviceType)
    if (typeof (mdmTHResponse) === undefined || !mdmTHResponse) {
      reject(new Errors.UnexpectedSystemError(`Missing rawTypeHierachy `));
    }
    console.log(JSON.stringify(mdmTHResponse));
    for (let thResource of mdmTHResponse.entry) {
      switch (thResource.resource.resourceType) {
        case 'Application':
          parsedValues.applicationGuid = thResource.resource.applicationGuid.value;
          parsedValues.applicationName = thResource.resource.name;
          break;
        case 'Proposition':
          parsedValues.propositionGuid = thResource.resource.propositionGuid.value;
          parsedValues.propositionName = thResource.resource.name;
          parsedValues.producingOrgGuid = thResource.resource.organizationGuid.value;
          parsedValues.consumingOrgGuid = thResource.resource.defaultCustomerOrganizationGuid.value;
          break;
        case 'DeviceGroup':
          parsedValues.deviceGroupName = thResource.resource.name;
          parsedValues.deviceGroupId = thResource.resource.id;
          break;
        case 'DeviceType':
          parsedValues.deviceTypeId = thResource.resource.id;
          parsedValues.deviceTypeName = thResource.resource.name;
          parsedValues.deviceTypeCustomAttribute = thResource.resource.customTypeAttributes;
          break;
        default:
          break;
      }
    }
  } catch (err) {
    console.log(`*** get TH from MDM : failed. err=${err}`);
    throw err;
  }

  console.log(`parsed : --- ${JSON.stringify(parsedValues)}`);
  deployConfig.SmokeTestDeviceTH = [];
  UpdateTHConfigData(deployConfig.SmokeTestDeviceTH, parsedValues);

  const content = JSON.stringify(deployConfig, null, 2);
  fs.writeFileSync(tofilepath, content);
  console.log(`*** TH Update Configuration file: successful`);
}

start().then(() => {
  console.log("********* Device TH updated successful!");
  process.exit();
}).catch((err) => {
  console.log(`error encountered=${err}`);
  // Do not fail the smoketest if this step failed. Update TH manually in the config.
  //process.exit(1);
});