import requests

class ProfileSvc:
    """Profile service calls encapsulation"""
    def __init__(self, url: str, token: str):
        self.url = url
        self.token = token

    def searchProfile(self, query:list[str]=[]) -> object:
        allQuery = "&".join(query)
        all = "?" + allQuery if len(allQuery) else allQuery
        url = f"{self.url}/connect/profile/Profile{all}"
        print('*** searchProfileByHsdpId url=%s' % (url))
        payload = ""
        headers = {
            'Content-Type': "application/json",
            'API-Version': "1",
            'Authorization': "Bearer " + self.token,
            'Accept': "application/json",
            'Cache-Control': "no-cache",
        }
        response = requests.request("GET", url, data=payload, headers=headers)
        return response

    # def createProfile(self, hsdpId, payload):
    #     url = self.url+"/connect/profile/Profile"
    #     print('*** createProfile url=%s hsdpId=%s' % (url, hsdpId))
    #     payload = '{"resourceType": "Profile", "serialNo": "dummySerialNum", "HSDPId": "%s",\
    #             "loginId": "dummyLoginId3", "identityType": "dummyIdentityType3",\
    #             "propositionName": "dummyPropName3", "propositionGuid": "618234df-d3c3-4af2-9521-dfdc19036180",\
    #             "applicationName": "notavailable3","applicationGuid": "45164f0f-f5ca-4a72-a45d-79d0a4b19762",\
    #             "oAuthClientId": "dummyOAuthClientId3", "oAuthClientName": "not available3",\
    #             "deviceGroupId": "dummydeviceGroupId3", "deviceGroupName": "dummydeviceGroupName3",\
    #             "deviceTypeId": "dummydeviceTypeId3", "deviceTypeName": "dummydeviceTypeName3",\
    #             "identitySignature": "dummyIdentitySig3",  "producingOrgGuid": "dummyIdentitySig3",\
    #             "consumingOrgGuid": "9a58329a-3eca-421e-be20-8ed91161295e",\
    #             "customAttributes": {"customAttributes": [ {"name": "calories","value": "175" },\
    #             {"name": "breakfast","value": "chai seed pudding" }, {"name": "servingSize", "value": "4 oz"}] },\
    #             "connectionStatus": {"status": "connected","lastUpdated": "2018-04-20T22:16:33.447Z"} }' \
    #             % (hsdpId)
    #     headers = {
    #         'Content-Type': "application/json",
    #         'API-Version': "1",
    #         'Authorization': "Bearer " + self.token,
    #         'Accept': "application/json",
    #         'Cache-Control': "no-cache",
    #     }
    #     response = requests.request("POST", url, data=payload, headers=headers)
    #     testPass = True
    #     if expects(response.status_code == 201, "expects response code to be 201"):
    #         data = response.json()
    #         if expects(hsdpId == data['HSDPId'], "expects hsdpId input is same as response"):
    #             global propositionGuid
    #             propositionGuid = data['propositionGuid']
    #         else:
    #             testPass = False
    #     else:
    #         testPass = False

    #     if testPass:
    #         print ("Passed: createProfile: newHsdpId=%s, propositionGuid=%s" %
    #             (hsdpId, propositionGuid))
    #     else:
    #         print ("Failed: createProfile: "+response.text)

    #     return testPass

    # def getProfileById(self, hsdpId, token):
    #     url = profileUrl + "/connect/profile/Profile/" + hsdpId
    #     print('*** getProfileById url=%s hsdpId=%s' % (url, hsdpId))
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
    #     if expects(response.status_code == 200, "expects response code to be 200"):
    #         data = response.json()
    #         if not expects(data['HSDPId'] == newHsdpId, "expects hsdpId to be same as one created"):
    #             testPass = False
    #     else:
    #         testPass = False
    #     if testPass:
    #         print ("Passed: getProfileById: newHsdpId=%s, propositionGuid=%s" % (hsdpId, propositionGuid))
    #     else:
    #         print ("Failed: getProfileById: "+response.text)
    #     return testPass

    # def searchProfileByHsdpId(self, hsdpId):
    #     url = profileUrl + "/connect/profile/Profile?hsdpid=" + hsdpId
    #     print('*** searchProfileByHsdpId url=%s' % (url))
    #     payload = ""
    #     headers = {
    #         'Content-Type': "application/json",
    #         'API-Version': "1",
    #         'Authorization': "Bearer " + self.token,
    #         'Accept': "application/json",
    #         'Cache-Control': "no-cache",
    #     }
    #     response = requests.request("GET", url, data=payload, headers=headers)
    #     testPass = True
    #     if not expects(response.status_code == 200, "expects response code to be 200"):
    #         testPass = False
    #     if testPass:
    #         print ("Passed: searchProfileByHsdpId: newHsdpId=%s" % (hsdpId))
    #     else:
    #         print ("Failed: searchProfileByHsdpId: "+response.text)
    #     return testPass

    # def searchProfileByPropositionGuid(self, guid, token):
    #     url = profileUrl + "/connect/profile/Profile?propositionGuid=" + guid
    #     print('*** searchProfileByPropositionGuid url=%s' % (url))
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
    #         print ("Passed: searchProfileByPropositionGuid: guid=%s" % (guid))
    #     else:
    #         print ("Failed: searchProfileByPropositionGuid: "+response.text)
    #     return testPass

    # def deleteProfileByIdExists(self, hsdpId, token):
    #     url = profileUrl + "/connect/profile/Profile/" + hsdpId
    #     print('*** deleteProfileByIdExists url=%s' % (url))
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
    #         print ("Passed: deleteProfileByIdExists: hsdpId=%s" % (hsdpId))
    #     else:
    #         print ("Failed: deleteProfileByIdExists: "+response.text)
    #     return testPass

    # def getProfileByIdNonExisting(self,hsdpId, token):
    #     url = profileUrl + "/connect/profile/Profile/" + hsdpId
    #     print('*** getProfileByIdNonExisting url=%s' % (url))
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
    #         print ("Passed: getProfileByIdNonExisting: newHsdpId=%s, propositionGuid=%s" % (hsdpId, propositionGuid))
    #     else:
    #         print ("Failed: getProfileByIdNonExisting: "+response.text)
    #     return testPass

    # def deleteProfileByIdNonExisting(self, hsdpId, token):
    #     url = profileUrl + "/connect/profile/Profile/" + hsdpId
    #     print('*** deleteProfileByIdNonExisting url=%s' % (url))
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
    #         print ("Passed: deleteProfileByIdNonExisting: hsdpId=%s" % (hsdpId))
    #     else:
    #         print ("Failed: deleteProfileByIdNonExisting: "+response.text)
    #     return testPass

    # def invokePresenceLambda(self, hsdpId, status, token):
    #     print('*** invokePresenceLambda for hsdpid =%s with connection status=%s' % (hsdpId, status))
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
    #     print(lambdaCommand)
    #     os.system(lambdaCommand)

    #     url = profileUrl + "/connect/profile/Profile/" + hsdpId
    #     print('*** getProfileById url=%s hsdpId=%s' % (url, hsdpId))
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
    #         print ("Passed: invokePresenceLambda: hsdpid =%s with connection status=%s" % (hsdpId, status))
    #     else:
    #         print ("Failed: invokePresenceLambda: " )
    #     return testPass
