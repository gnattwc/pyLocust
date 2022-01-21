import requests
import json
import datetime
import sys
import os
import time
import subprocess
from testResult import TestResult
from prettytable import PrettyTable



pathToConfig = sys.argv[1]
fileName = os.path.join(pathToConfig, 'deploy_config_e2e.json')
f = open(fileName, 'r')
deployConfig = json.load(f)

testResultList = []
isCallSuccess = False
passCount = 0
failCount = 0
tTokenStart = 0.00
tTokenEnd = 0.00


def expects(cond, desc):
    if not cond:
        print('Failed Condition: '+desc)
        return False
    return True


iamUrl = deployConfig['IAM_URL']
accessToken = ""
def getAccessToken(grantUser, grantPass, clientUser, clientPass):
    url = iamUrl+'/authorize/oauth2/token'
    print('*** getAccessToken iamUrl=%s grantUser=%s clientUser=%s' % (url, grantUser, clientUser))
    payload = 'grant_type=password&username='+grantUser+'&password='+grantPass
    headers = {
        'api-version': "1",
        'Content-Type': "application/x-www-form-urlencoded",
        'Cache-Control': "no-cache"
    }
    response = requests.request(
        "POST", url, data=payload, headers=headers, auth=(clientUser, clientPass))
    if expects(response.status_code == 200, "expects response code to be 200"):
        global accessToken
        data = response.json()
        accessToken = data['access_token']
        print ("Passed: getAccessToken")
        return True
    else:
        print ("Failed: getAccessToken: "+response.text)
        return False



profileUrl = "https://" + deployConfig['DomainName']
newHsdpId = "hsdpId" + datetime.datetime.now().strftime("%Y%m%d%H%M%S")
propositionGuid = ""


def createProfile(profileUrl, hsdpId, token):
    url = profileUrl+"/connect/profile/Profile"
    print('*** createProfile url=%s hsdpId=%s' % (url, hsdpId))
    payload = '{"resourceType": "Profile", "serialNo": "dummySerialNum", "HSDPId": "%s",\
            "loginId": "dummyLoginId3", "identityType": "dummyIdentityType3",\
            "propositionName": "dummyPropName3", "propositionGuid": "618234df-d3c3-4af2-9521-dfdc19036180",\
            "applicationName": "notavailable3","applicationGuid": "45164f0f-f5ca-4a72-a45d-79d0a4b19762",\
            "oAuthClientId": "dummyOAuthClientId3", "oAuthClientName": "not available3",\
            "deviceGroupId": "dummydeviceGroupId3", "deviceGroupName": "dummydeviceGroupName3",\
            "deviceTypeId": "dummydeviceTypeId3", "deviceTypeName": "dummydeviceTypeName3",\
            "identitySignature": "dummyIdentitySig3",  "producingOrgGuid": "dummyIdentitySig3",\
            "consumingOrgGuid": "9a58329a-3eca-421e-be20-8ed91161295e",\
            "customAttributes": {"customAttributes": [ {"name": "calories","value": "175" },\
             {"name": "breakfast","value": "chai seed pudding" }, {"name": "servingSize", "value": "4 oz"}] },\
             "connectionStatus": {"status": "connected","lastUpdated": "2018-04-20T22:16:33.447Z"} }' \
             % (hsdpId)
    headers = {
        'Content-Type': "application/json",
        'API-Version': "1",
        'Authorization': "Bearer " + token,
        'Accept': "application/json",
        'Cache-Control': "no-cache",
    }
    response = requests.request("POST", url, data=payload, headers=headers)
    testPass = True
    if expects(response.status_code == 201, "expects response code to be 201"):
        data = response.json()
        if expects(hsdpId == data['HSDPId'], "expects hsdpId input is same as response"):
            global propositionGuid
            propositionGuid = data['propositionGuid']
        else:
            testPass = False
    else:
        testPass = False

    if testPass:
        print ("Passed: createProfile: newHsdpId=%s, propositionGuid=%s" %
               (hsdpId, propositionGuid))
    else:
        print ("Failed: createProfile: "+response.text)

    return testPass



def getProfileById(hsdpId, token):
    url = profileUrl + "/connect/profile/Profile/" + hsdpId
    print('*** getProfileById url=%s hsdpId=%s' % (url, hsdpId))
    payload = ""
    headers = {
        'Content-Type': "application/json",
        'API-Version': "1",
        'Authorization': "Bearer " + token,
        'Accept': "application/json",
        'Cache-Control': "no-cache",
    }
    response = requests.request("GET", url, data=payload, headers=headers)
    testPass = True
    if expects(response.status_code == 200, "expects response code to be 200"):
        data = response.json()
        if not expects(data['HSDPId'] == newHsdpId, "expects hsdpId to be same as one created"):
            testPass = False
    else:
        testPass = False
    if testPass:
        print ("Passed: getProfileById: newHsdpId=%s, propositionGuid=%s" % (hsdpId, propositionGuid))
    else:
        print ("Failed: getProfileById: "+response.text)
    return testPass


def searchProfileByHsdpId(hsdpId, token):
    url = profileUrl + "/connect/profile/Profile?hsdpid=" + hsdpId
    print('*** searchProfileByHsdpId url=%s' % (url))
    payload = ""
    headers = {
        'Content-Type': "application/json",
        'API-Version': "1",
        'Authorization': "Bearer " + token,
        'Accept': "application/json",
        'Cache-Control': "no-cache",
    }
    response = requests.request("GET", url, data=payload, headers=headers)
    testPass = True
    if not expects(response.status_code == 200, "expects response code to be 200"):
        testPass = False
    if testPass:
        print ("Passed: searchProfileByHsdpId: newHsdpId=%s" % (hsdpId))
    else:
        print ("Failed: searchProfileByHsdpId: "+response.text)
    return testPass

def searchProfileByPropositionGuid(guid, token):
    url = profileUrl + "/connect/profile/Profile?propositionGuid=" + guid
    print('*** searchProfileByPropositionGuid url=%s' % (url))
    payload = ""
    headers = {
        'Content-Type': "application/json",
        'API-Version': "1",
        'Authorization': "Bearer " + token,
        'Accept': "application/json",
        'Cache-Control': "no-cache",
    }
    response = requests.request("GET", url, data=payload, headers=headers)
    testPass = True
    if not expects(response.status_code == 200, "expects response code to be 200"):
        testPass = False
    if testPass:
        print ("Passed: searchProfileByPropositionGuid: guid=%s" % (guid))
    else:
        print ("Failed: searchProfileByPropositionGuid: "+response.text)
    return testPass

def deleteProfileByIdExists(hsdpId, token):
    url = profileUrl + "/connect/profile/Profile/" + hsdpId
    print('*** deleteProfileByIdExists url=%s' % (url))
    payload = ""
    headers = {
        'Content-Type': "application/json",
        'API-Version': "1",
        'Authorization': "Bearer " + token,
        'Accept': "application/json",
        'Cache-Control': "no-cache",
    }
    response = requests.request("DELETE", url, data=payload, headers=headers)
    testPass = True
    if not expects(response.status_code == 200, "expects response code to be 200"):
        testPass = False
    if testPass:
        print ("Passed: deleteProfileByIdExists: hsdpId=%s" % (hsdpId))
    else:
        print ("Failed: deleteProfileByIdExists: "+response.text)
    return testPass

def getProfileByIdNonExisting(hsdpId, token):
    url = profileUrl + "/connect/profile/Profile/" + hsdpId
    print('*** getProfileByIdNonExisting url=%s' % (url))
    payload = ""
    headers = {
        'Content-Type': "application/json",
        'API-Version': "1",
        'Authorization': "Bearer " + token,
        'Accept': "application/json",
        'Cache-Control': "no-cache",
    }
    response = requests.request("GET", url, data=payload, headers=headers)
    testPass = True
    if expects(response.status_code == 404, "expects response code to be 404"):
        data = response.json()
        if not expects("The specific profile does not exist" in data['issue'][0]['details']['text'], "expects 'does not exist' text"):
            testPass = False
    else:
        testPass = False
    if testPass:
        print ("Passed: getProfileByIdNonExisting: newHsdpId=%s, propositionGuid=%s" % (hsdpId, propositionGuid))
    else:
        print ("Failed: getProfileByIdNonExisting: "+response.text)
    return testPass

def deleteProfileByIdNonExisting(hsdpId, token):
    url = profileUrl + "/connect/profile/Profile/" + hsdpId
    print('*** deleteProfileByIdNonExisting url=%s' % (url))
    payload = ""
    headers = {
        'Content-Type': "application/json",
        'API-Version': "1",
        'Authorization': "Bearer " + token,
        'Accept': "application/json",
        'Cache-Control': "no-cache",
    }
    response = requests.request("DELETE", url, data=payload, headers=headers)
    testPass = True
    if expects(response.status_code == 404, "expects response code to be 404"):
        data = response.json()
        if not expects("The specific profile does not exist" in data['issue'][0]['details']['text'], "expects 'does not exist' text"):
            testPass = False
    else:
        testPass = False
    if testPass:
        print ("Passed: deleteProfileByIdNonExisting: hsdpId=%s" % (hsdpId))
    else:
        print ("Failed: deleteProfileByIdNonExisting: "+response.text)
    return testPass

def invokePresenceLambda(hsdpId, status, token):
    print('*** invokePresenceLambda for hsdpid =%s with connection status=%s' % (hsdpId, status))
    region = deployConfig['AWS_DEFAULT_REGION']
    lambdaName = 'PRF-Presence-%s' % deployConfig['NODE_ENV']

    scriptPath = os.path.dirname(os.path.abspath(__file__))
    presenceConfig = os.path.join(scriptPath, "PresenceLifeCycleInput.json")
    with open(presenceConfig, "r") as jsonFile:
        data = json.load(jsonFile)

    data["clientId"] = hsdpId
    data["eventType"] = status

    with open(presenceConfig, "w") as jsonFile:
        json.dump(data, jsonFile)

    lambdaCommand = 'aws lambda invoke --invocation-type RequestResponse --function-name ' + lambdaName + ' --region ' + region + ' --log-type Tail --payload ' + presenceConfig + ' outputfile.txt'
    print(lambdaCommand)
    os.system(lambdaCommand)

    url = profileUrl + "/connect/profile/Profile/" + hsdpId
    print('*** getProfileById url=%s hsdpId=%s' % (url, hsdpId))
    payload = ""

    headers = {
        'Content-Type': "application/json",
        'API-Version': "1",
        'Authorization': "Bearer " + token,
        'Accept': "application/json",
        'Cache-Control': "no-cache",
    }
    response = requests.request("GET", url, data=payload, headers=headers)

    if expects(response.status_code == 200, "expects response code to be 200"):
        data = response.json()
        if expects(status == data['connectionStatus']['status'], "expects status input is same as response"):
            testPass = True
        else:
            testPass = False

    if testPass:
        print ("Passed: invokePresenceLambda: hsdpid =%s with connection status=%s" % (hsdpId, status))
    else:
        print ("Failed: invokePresenceLambda: " )
    return testPass

# function calls
tTokenStart = time.time()
isCallSuccess = getAccessToken(deployConfig['ConnectIoTProducer'], deployConfig['ConnectIoTProducerPassword'],
deployConfig['SmokeTestClientUser'], deployConfig['SmokeTestClientPassword'])
tTokenEnd = time.time()
if isCallSuccess:
    passCount += 1
else:
    failCount +=  1
testResultList.append(TestResult('Get IAM Token', "SUCCESS" if isCallSuccess else "FAIL", tTokenEnd - tTokenStart, tTokenEnd - tTokenStart, deployConfig['IAM_URL']))

tTokenStart = time.time()
isCallSuccess = createProfile(profileUrl, newHsdpId, accessToken)
tTokenEnd = time.time()
if isCallSuccess:
    passCount += 1
else:
    failCount +=  1
testResultList.append(TestResult('API POST', "SUCCESS" if isCallSuccess else "FAIL", tTokenEnd - tTokenStart, tTokenEnd - tTokenStart, profileUrl))

tTokenStart = time.time()
isCallSuccess = getProfileById(newHsdpId, accessToken)
tTokenEnd = time.time()
if isCallSuccess:
    passCount += 1
else:
    failCount +=  1
testResultList.append(TestResult('API GET by ID', "SUCCESS" if isCallSuccess else "FAIL", tTokenEnd - tTokenStart, tTokenEnd - tTokenStart, profileUrl))

tTokenStart = time.time()
isCallSuccess = searchProfileByHsdpId(newHsdpId, accessToken)
tTokenEnd = time.time()
if isCallSuccess:
    passCount += 1
else:
    failCount +=  1
testResultList.append(TestResult('API GET (Search HsdpId)', "SUCCESS" if isCallSuccess else "FAIL", tTokenEnd - tTokenStart, tTokenEnd - tTokenStart, profileUrl))

tTokenStart = time.time()
isCallSuccess = searchProfileByPropositionGuid(propositionGuid, accessToken)
tTokenEnd = time.time()
if isCallSuccess:
    passCount += 1
else:
    failCount +=  1
testResultList.append(TestResult('API GET (Search PropGuid)', "SUCCESS" if isCallSuccess else "FAIL", tTokenEnd - tTokenStart, tTokenEnd - tTokenStart, profileUrl))

tTokenStart = time.time()
isCallSuccess = deleteProfileByIdExists(newHsdpId, accessToken)
tTokenEnd = time.time()
if isCallSuccess:
    passCount += 1
else:
    failCount +=  1
testResultList.append(TestResult('API DELETE', "SUCCESS" if isCallSuccess else "FAIL", tTokenEnd - tTokenStart, tTokenEnd - tTokenStart, profileUrl))

tTokenStart = time.time()
isCallSuccess = getProfileByIdNonExisting(newHsdpId, accessToken)
tTokenEnd = time.time()
if isCallSuccess:
    passCount += 1
else:
    failCount +=  1
testResultList.append(TestResult('API GET (invalid)', "SUCCESS" if isCallSuccess else "FAIL", tTokenEnd - tTokenStart, tTokenEnd - tTokenStart, profileUrl))

tTokenStart = time.time()
isCallSuccess = deleteProfileByIdNonExisting('bogus_id_blah_blah', accessToken)
tTokenEnd = time.time()
if isCallSuccess:
    passCount += 1
else:
    failCount += 1
testResultList.append(TestResult('API DELETE (invalid)', "SUCCESS" if isCallSuccess else "FAIL", tTokenEnd - tTokenStart, tTokenEnd - tTokenStart, profileUrl))


print('############################################################################## EXECUTION SUMMARY ################################################################################')
t = PrettyTable(['TEST CASE NAME', 'STATUS', 'EXECUTION TIME', 'RESPONSE TIME', 'ENDPOINT'])
for res in testResultList:
    t.add_row([res.name, res.status, res.executionTime, res.responseTime, res.endpoint])

print(t)
print('APPLICATION:  Connect Profile')
print('RELEASE:  PU 1.0.0.3')
print('REGION %s' % deployConfig['AWS_DEFAULT_REGION'])
print('TOTAL TEST CASES %s' % (passCount + failCount))
print('PASSED TEST CASES %s' % (passCount))
print('FAILED TEST CASES %s' % (failCount))

if (failCount > 0):
    exit(2)
