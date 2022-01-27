from expects import *

class ProfileSvc:
    """Profile service calls encapsulation"""
    def __init__(self, url: str, client: object, logger = None):
        self.url = url
        self.client = client
        self.logger = logger

    def searchProfile(self, token:str, query:list[str]=[]) -> object:
        allQuery = "&".join(query)
        all = "?" + allQuery if len(allQuery) else allQuery
        url = f"{self.url}/connect/profile/Profile{all}"
        self.logger.info('*** searchProfileByHsdpId url=%s' % (url))
        payload = ""
        headers = {
            'Content-Type': "application/json",
            'API-Version': "2",
            'Authorization': "Bearer " + token,
            'Accept': "application/json",
            'Cache-Control': "no-cache",
        }
        response = self.client.get(url, data=payload, headers=headers, name="searchProfile")
        expect(response.status_code).to(be(200))
        return response.json()

    def createProfile(self, token, device_th, hsdp_id):
        url = self.url+"/connect/profile/Profile"
        self.logger.info('*** createProfile url=%s hsdpId=%s' % (url, hsdp_id))
        payload = {
            "resourceType": "Profile",
            "serialNo": "dummySerialNum",
            "HSDPId": hsdp_id,
            "loginId": "dummyLoginId3",
            "identityType": "dummyIdentityType3",
            "oAuthClientId": "dummyOAuthClientId3",
            "oAuthClientName": "not available3",
            "identitySignature": "dummyIdentitySig3",
            "applicationName": device_th['applicationName'],
            "applicationGuid": device_th['applicationGuid'],
            "propositionName": device_th['propositionName'],
            "propositionGuid": device_th['propositionGuid'],
            "deviceGroupName": device_th['deviceGroupName'],
            "deviceGroupId": device_th['deviceGroupId'],
            "deviceTypeName": device_th['deviceTypeName'],
            "deviceTypeId": device_th['deviceTypeId'],
            "producingOrgGuid": device_th['producingOrgGuid'],
            "consumingOrgGuid": device_th['consumingOrgGuid']
            }
        headers = {
            'Content-Type': "application/json",
            'API-Version': "2",
            'Authorization': "Bearer " + token,
            'Accept': "application/json",
            'Cache-Control': "no-cache",
        }
        response = self.client.post( url, data=str(payload), headers=headers, name="createProfile")
        # response = self.client.post( url, data=str(payload), headers=headers)
        expect(response.status_code).to(be(201))
        data = response.json()
        expect(data['HSDPId']).to(equal(hsdp_id))
        return data

    def getProfileById(self, token, hsdp_id):
        url = self.url + "/connect/profile/Profile/" + hsdp_id
        self.logger.info('*** getProfileById url=%s hsdpId=%s' % (url, hsdp_id))
        payload = ""
        headers = {
            'Content-Type': "application/json",
            'API-Version': "2",
            'Authorization': "Bearer " + token,
            'Accept': "application/json",
            'Cache-Control': "no-cache",
        }
        response = self.client.get(url, data=str(payload), headers=headers, name="getProfileById")
        expect(response.status_code).to(be(200))
        data = response.json()
        expect(data['HSDPId']).to(equal(hsdp_id))
        return data

    def deleteProfileById(self, token, hsdpId):
        url = self.url + f"/connect/profile/Profile/{hsdpId}"
        self.logger.info('*** deleteProfileById url=%s' % (url))
        headers = {
            'Content-Type': "application/json",
            'API-Version': "2",
            'Authorization': "Bearer " + token,
            'Accept': "application/json",
            'Cache-Control': "no-cache",
        }
        response = self.client.delete(url, headers=headers, name="deleteProfile")
        expect(response.status_code).to(be(200))

    # def searchProfileByPropositionGuid(self, guid, token):
    #     url = profileUrl + "/connect/profile/Profile?propositionGuid=" + guid
    #     self.logger.info('*** searchProfileByPropositionGuid url=%s' % (url))
    #     payload = ""
    #     headers = {
    #         'Content-Type': "application/json",
    #         'API-Version': "1",
    #         'Authorization': "Bearer " + token,
    #         'Accept': "application/json",
    #         'Cache-Control': "no-cache",
    #     }
    #     response = requests.request("GET", url, data=payload, headers=headers)
    #     testPass = True
    #     if not expects(response.status_code == 200, "expects response code to be 200"):
    #         testPass = False
    #     if testPass:
    #         self.logger.info ("Passed: searchProfileByPropositionGuid: guid=%s" % (guid))
    #     else:
    #         self.logger.info ("Failed: searchProfileByPropositionGuid: "+response.text)
    #     return testPass

    # def deleteProfileByIdExists(self, hsdpId, token):
    #     url = profileUrl + "/connect/profile/Profile/" + hsdpId
    #     self.logger.info('*** deleteProfileByIdExists url=%s' % (url))
    #     payload = ""
    #     headers = {
    #         'Content-Type': "application/json",
    #         'API-Version': "1",
    #         'Authorization': "Bearer " + token,
    #         'Accept': "application/json",
    #         'Cache-Control': "no-cache",
    #     }
    #     response = requests.request("DELETE", url, data=payload, headers=headers)
    #     testPass = True
    #     if not expects(response.status_code == 200, "expects response code to be 200"):
    #         testPass = False
    #     if testPass:
    #         self.logger.info ("Passed: deleteProfileByIdExists: hsdpId=%s" % (hsdpId))
    #     else:
    #         self.logger.info ("Failed: deleteProfileByIdExists: "+response.text)
    #     return testPass

    # def getProfileByIdNonExisting(self,hsdpId, token):
    #     url = profileUrl + "/connect/profile/Profile/" + hsdpId
    #     self.logger.info('*** getProfileByIdNonExisting url=%s' % (url))
    #     payload = ""
    #     headers = {
    #         'Content-Type': "application/json",
    #         'API-Version': "1",
    #         'Authorization': "Bearer " + token,
    #         'Accept': "application/json",
    #         'Cache-Control': "no-cache",
    #     }
    #     response = requests.request("GET", url, data=payload, headers=headers)
    #     testPass = True
    #     if expects(response.status_code == 404, "expects response code to be 404"):
    #         data = response.json()
    #         if not expects("The specific profile does not exist" in data['issue'][0]['details']['text'], "expects 'does not exist' text"):
    #             testPass = False
    #     else:
    #         testPass = False
    #     if testPass:
    #         self.logger.info ("Passed: getProfileByIdNonExisting: newHsdpId=%s, propositionGuid=%s" % (hsdpId, propositionGuid))
    #     else:
    #         self.logger.info ("Failed: getProfileByIdNonExisting: "+response.text)
    #     return testPass

    # def deleteProfileByIdNonExisting(self, hsdpId, token):
    #     url = profileUrl + "/connect/profile/Profile/" + hsdpId
    #     self.logger.info('*** deleteProfileByIdNonExisting url=%s' % (url))
    #     payload = ""
    #     headers = {
    #         'Content-Type': "application/json",
    #         'API-Version': "1",
    #         'Authorization': "Bearer " + token,
    #         'Accept': "application/json",
    #         'Cache-Control': "no-cache",
    #     }
    #     response = requests.request("DELETE", url, data=payload, headers=headers)
    #     testPass = True
    #     if expects(response.status_code == 404, "expects response code to be 404"):
    #         data = response.json()
    #         if not expects("The specific profile does not exist" in data['issue'][0]['details']['text'], "expects 'does not exist' text"):
    #             testPass = False
    #     else:
    #         testPass = False
    #     if testPass:
    #         self.logger.info ("Passed: deleteProfileByIdNonExisting: hsdpId=%s" % (hsdpId))
    #     else:
    #         self.logger.info ("Failed: deleteProfileByIdNonExisting: "+response.text)
    #     return testPass

    # def invokePresenceLambda(self, hsdpId, status, token):
    #     self.logger.info('*** invokePresenceLambda for hsdpid =%s with connection status=%s' % (hsdpId, status))
    #     region = deployConfig['AWS_DEFAULT_REGION']
    #     lambdaName = 'PRF-Presence-%s' % deployConfig['NODE_ENV']

    #     scriptPath = os.path.dirname(os.path.abspath(__file__))
    #     presenceConfig = os.path.join(scriptPath, "PresenceLifeCycleInput.json")
    #     with open(presenceConfig, "r") as jsonFile:
    #         data = json.load(jsonFile)

    #     data["clientId"] = hsdpId
    #     data["eventType"] = status

    #     with open(presenceConfig, "w") as jsonFile:
    #         json.dump(data, jsonFile)

    #     lambdaCommand = 'aws lambda invoke --invocation-type RequestResponse --function-name ' + lambdaName + ' --region ' + region + ' --log-type Tail --payload ' + presenceConfig + ' outputfile.txt'
    #     self.logger.info(lambdaCommand)
    #     os.system(lambdaCommand)

    #     url = profileUrl + "/connect/profile/Profile/" + hsdpId
    #     self.logger.info('*** getProfileById url=%s hsdpId=%s' % (url, hsdpId))
    #     payload = ""

    #     headers = {
    #         'Content-Type': "application/json",
    #         'API-Version': "1",
    #         'Authorization': "Bearer " + token,
    #         'Accept': "application/json",
    #         'Cache-Control': "no-cache",
    #     }
    #     response = requests.request("GET", url, data=payload, headers=headers)

    #     if expects(response.status_code == 200, "expects response code to be 200"):
    #         data = response.json()
    #         if expects(status == data['connectionStatus']['status'], "expects status input is same as response"):
    #             testPass = True
    #         else:
    #             testPass = False

    #     if testPass:
    #         self.logger.info ("Passed: invokePresenceLambda: hsdpid =%s with connection status=%s" % (hsdpId, status))
    #     else:
    #         self.logger.info ("Failed: invokePresenceLambda: " )
    #     return testPass
