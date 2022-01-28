'use strict'

const fs = require('fs');
const debugLog = require('debug')('info');

const { getClientToken } = require('./lib/authAccessToken');
const provisionNewDevice = require('./lib/provisionDevice').create;
const ConfigContainer = require('./lib/configContainer');
const prereqCheck = require('./lib/prereqCheck');

const fromfilepath = process.argv[2];
const tofilepath = fromfilepath;
let rawdata = fs.readFileSync(fromfilepath);
let deployConfig = JSON.parse(rawdata);

function UpdateConfigData(devices, provisionResponses) {
  provisionResponses.forEach(resp => {
    devices.push({
      HsdpId: resp.hsdpId,
      UserId: resp.loginId,
      UserPassword: resp.loginPassowrd,
      ClientId: resp.clientId,
      ClientSecret: resp.clientSecret
    });
  });
}

function mustExist(validateObj) {
  Object.entries(validateObj).forEach((e) => {
    if (!e[1]) {
      throw Error(`missing ${e[0]}`);
    }
  });
}

// ============ start here ==============
async function start() {
  console.log(`========= ConnectProfile v${deployConfig.ReleaseVersion} Provision Device:`);
  console.log(`ProvisionUrl=${deployConfig.SmokeTestProvisionUrl}`);
  console.log(`SmokeTestIamUrl=${deployConfig.IAM_URL}`);
  const numDevicesToProvision = 1;
  console.log(`provisioning ${numDevicesToProvision} devices`);

  // sanity check
  mustExist({
    IAM_URL: deployConfig.IAM_URL,
    SmokeTestProvisionUrl: deployConfig.SmokeTestProvisionUrl,
    SmokeTestBootstrapClientId: deployConfig.SmokeTestBootstrapClientId,
    SmokeTestBootstrapClientSecret: deployConfig.SmokeTestBootstrapClientSecret,
    SmokeTestDeviceType: deployConfig.SmokeTestDeviceType,
    SmokeTestDistrustBootstrapClientId: deployConfig.SmokeTestDistrustBootstrapClientId,
    SmokeTestDistrustBootstrapClientSecret: deployConfig.SmokeTestDistrustBootstrapClientSecret,
    SmokeTestDistrustDeviceType: deployConfig.SmokeTestDistrustDeviceType,
  });

  // provision new devices - with trusted org
  let bootstrapToken = undefined;
  try {
    console.log(`*** Get Bootstrap Access Token: starts`);
    const respBody = await getClientToken(deployConfig.IAM_URL, deployConfig.SmokeTestBootstrapClientId, deployConfig.SmokeTestBootstrapClientSecret);
    bootstrapToken = respBody.access_token;
    debugLog(`got client token=${bootstrapToken}`);
    console.log(`*** Get Bootstrap Access Token: successful`);
  } catch (err) {
    console.log(`*** Get Bootstrap Access Token: failed. err=${err}`);
    throw err;
  }
  let provisionResponses = [];

  try {
    for (const i of Array(numDevicesToProvision).keys()) {
      const serialNumber = Math.floor(Math.random() * 999990 + 200000).toString();
      console.log(`*** Provisioning device ${i + 1} of ${numDevicesToProvision}`);
      const provisionResponse = await provisionNewDevice(deployConfig.SmokeTestProvisionUrl, bootstrapToken, deployConfig.SmokeTestDeviceType, serialNumber)
      console.log(`*** Provision device ${i + 1} of ${numDevicesToProvision}: successful.`);
      debugLog(`hsdpId`, provisionResponse.hsdpId)
      provisionResponses.push(provisionResponse);
    }
  } catch (err) {
    console.log(`*** Provision device: failed. err=${err}`);
    throw err;
  }

  deployConfig.SmokeTestDevices = [];
  UpdateConfigData(deployConfig.SmokeTestDevices, provisionResponses);

  // provision new devices - with distrusted org
  let bootstrapTokenDistrust = undefined;
  try {
    console.log(`*** Get Distrust Bootstrap Access Token: starts`);
    const respBody = await getClientToken(deployConfig.IAM_URL, deployConfig.SmokeTestDistrustBootstrapClientId, deployConfig.SmokeTestDistrustBootstrapClientSecret);
    bootstrapTokenDistrust = respBody.access_token;
    debugLog(`got distrust client token=${bootstrapTokenDistrust}`);
    console.log(`*** Get Distrust Bootstrap Access Token: successful`);
  } catch (err) {
    console.log(`*** Get Distrust Bootstrap Access Token: failed. err=${err}`);
    throw err;
  }

  let provisionResponsesDistrust = [];
  try {
    for (const i of Array(numDevicesToProvision).keys()) {
      const serialNumber = Math.floor(Math.random() * 999990 + 200000).toString();
      console.log(`*** Provisioning distrust device ${i + 1} of ${numDevicesToProvision}`);
      const provisionResponse = await provisionNewDevice(deployConfig.SmokeTestProvisionUrl, bootstrapTokenDistrust, deployConfig.SmokeTestDistrustDeviceType, serialNumber)
      console.log(`*** Provision distrust device ${i + 1} of ${numDevicesToProvision}: successful.`);
      debugLog(`hsdpId`, provisionResponse.hsdpId)
      provisionResponsesDistrust.push(provisionResponse);
    }
  } catch (err) {
    console.log(`*** Provision device: failed. err=${err}`);
    throw err;
  }

  deployConfig.SmokeTestDistrustDevices = [];
  UpdateConfigData(deployConfig.SmokeTestDistrustDevices, provisionResponsesDistrust);

  const content = JSON.stringify(deployConfig, null, 2);
  fs.writeFileSync(tofilepath, content);
  console.log(`*** Update Configuration file: successful`);

  //
  // prereq check
  //
  try {
    const updatedConfigObj2 = new ConfigContainer().getConfigObj(deployConfig);
    if (updatedConfigObj2.Devices.length < 1) throw new Error('need 1 device provisioned');
    if (updatedConfigObj2.DistrustDevices.length < 1) throw new Error('need 1 distrust device provisioned');
    await prereqCheck(updatedConfigObj2);

    console.log(`*** prereqCheck: passed`);
  } catch (err) {
    console.log(`*** prereqCheck: failed. err=${err}`);
    throw err;
  };

}

start().then(() => {
  console.log("********* Provision Device successful!");
  process.exit();
}).catch((err) => {
  console.log(`error encountered=${err}`);
  process.exit(1);
});