const assert = require('assert');

function prfValidation(response, input, etag = 'W/1', apiversion = 1, fromVersion = null) {
   respHeader = response.headers;
   assert(respHeader.transactionid, "TransactionId is null");
   assert(respHeader['api-version'] == apiversion, "api-version NOT valid");
   assert(respHeader.etag === etag, "Expected : " + etag + "Actual : " + respHeader.etag + "ETag is not valid");
   assert.strictEqual(response.body.resourceType, input.resourceType, "resourcetype is  not valid ");
   assert.strictEqual(response.body.serialNo, input.serialNo, "serial no is  not valid ");
   assert.strictEqual(response.body.HSDPId, input.HSDPId, "hsdpid is not valid");
   assert.strictEqual(response.body.loginId, input.loginId, "loginid is  not valid ");
   assert.strictEqual(response.body.propositionName, input.propositionName, "prop name is  not valid ");
   assert.strictEqual(response.body.propositionGuid, input.propositionGuid, "prop guid is not valid");
   assert.strictEqual(response.body.applicationName, input.applicationName, "app name is not valid");
   assert.strictEqual(response.body.applicationGuid, input.applicationGuid, "app guid is not valid");
   assert.strictEqual(response.body.oAuthClientId, input.oAuthClientId, "OAC is not valid");
   assert.strictEqual(response.body.oAuthClientName, input.oAuthClientName, "OAC name is  not valid ");
   assert.strictEqual(response.body.deviceGroupId, input.deviceGroupId, "DG id is  not valid ");
   assert.strictEqual(response.body.deviceGroupName, input.deviceGroupName, "DG name is not valid");
   assert.strictEqual(response.body.deviceTypeId, input.deviceTypeId, "DT id is  not valid ");
   assert.strictEqual(response.body.deviceTypeName, input.deviceTypeName, "DT name is  not valid ");
   assert.strictEqual(response.body.identitySignature, input.identitySignature, "signature is not valid");
   assert.strictEqual(response.body.producingOrgGuid, input.producingOrgGuid, "producingOrg is not valid");
   assert.strictEqual(response.body.consumingOrgGuid, input.consumingOrgGuid, "consumingOrg is not valid");
   assert(input.connectionStatus ? response.body.connectionStatus.status == input.connectionStatus.status : response.body.connectionStatus.status == null, 'connection status is null');
   assert(input.connectionStatus ? response.body.connectionStatus.lastUpdated == input.connectionStatus.lastUpdated : response.body.connectionStatus.lastUpdated == null, "Actual : " +
      response.body.connectionStatus.lastUpdated + "Expected : " + input.connectionStatus + 'connection lastupdated time');
   if (apiversion == 2) {
      if (input.registrationDate == undefined) {
         assert(JSON.stringify(response.body.registrationDate));
      }
      else {
         assert(JSON.stringify(response.body.registrationDate) == JSON.stringify(input.registrationDate), "Registration Date is not matching with Input");
      }
      if (input.iamAttributes == undefined) {
         assert(response.body.iamAttributes == null, "IAM attribute for undefined is not null");
      }
      else {
         assert(response.body.iamAttributes, "IAM attribute is null");
      }
      if (input.customAttributes == undefined) {
         assert(response.body.customAttributes == null, "customAttributes for undefined is not null");
      }
      else {
         assert(response.body.customAttributes, "CustomAttribute is null");
      }
      if (input.firmwares == undefined) {
         assert(response.body.firmwares == null, "firmwares for undefined is not null");
      }
      else {
         assert(response.body.firmwares, "Firmware is null");
       }
       if(fromVersion && fromVersion.startsWith('1.5'))
       {
         assert(response.body.createdBySource == 'API',`Expected createdBySource : API  ; Actual : ${response.body.createdBySource}`);
         assert(response.body.hasOwnProperty('deviceTypeAttributes'), "deviceType Attribute doesnt exist");
       }
   }
}

module.exports = {
   prfValidation
}