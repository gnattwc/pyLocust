'use strict'
const debugLog = require('debug')('configContainer');

module.exports = class ConfigContainer {
    constructor() {
    };

    getConfigObj(deployConfig) {
        debugLog('deployConfig=', deployConfig);
        const configObj = {
            Stage: deployConfig.NODE_ENV,
            Region: deployConfig.AWS_DEFAULT_REGION,
            IamUrl: deployConfig.IAM_URL,
            CustomAuthorizerName: deployConfig.SmokeTestCustomAuthorizerName,
            IotEndpoint: deployConfig.SmokeTestIotEndpoint,
            ProvisionUrl: deployConfig.SmokeTestProvisionUrl,
            BootstrapClientId: deployConfig.SmokeTestBootstrapClientId,
            BootstrapClientSecret: deployConfig.SmokeTestBootstrapClientSecret,
            DeviceType: deployConfig.SmokeTestDeviceType,
            Devices: deployConfig.SmokeTestDevices,
            DistrustDevices: deployConfig.SmokeTestDistrustDevices,
            DistrustDeviceType: deployConfig.SmokeTestDistrustDeviceType,
            DomainName: deployConfig.DomainName,
            UserName: deployConfig.SmokeTestUsername,
            UserPwd: deployConfig.SmokeTestUserPwd,
            SvcAccountId: deployConfig.SmokeTestSvcAccountServiceId,
            SvcAccountPrivateKey: deployConfig.SmokeTestSvcAccountPrivateKey,
            DistrustSvcAccountId: deployConfig.SmokeTestDistrustSvcAccountServiceId,
            DistrustSvcAccountPrivateKey: deployConfig.SmokeTestDistrustSvcAccountPrivateKey,
            DiscoveryUrl: deployConfig.SmokeTestDiscoveryUrl,
            DscProfileName: deployConfig.SmokeTestDiscoveryNames['PRF'],
        };
        Object.keys(configObj).forEach(k => {
            debugLog(k, configObj[k]);
            if (!configObj[k]) throw Error(`Critical config ${k} is missing`);
        });

        // non-critical configs
        if ('SmokeTestDeviceTH' in deployConfig) {
            configObj.DeviceTypeHierarchy = deployConfig.SmokeTestDeviceTH;
        }
        if ('SmokeTestGatewayKey' in deployConfig) {
            configObj.GatewayKey = deployConfig.SmokeTestGatewayKey.join().replace(/,/g, '\n');
        }
        configObj.Qos = deployConfig.SmokeTestQos || 1;

        debugLog('configObj=', configObj);
        return configObj;
    }
};