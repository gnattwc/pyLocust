from expects import *


class ProfileSvc:
    """Profile service calls encapsulation"""

    def __init__(self, url: str, client: object, logger=None):
        self.url = url
        self.client = client
        self.logger = logger

    def searchProfile(self, token: str, query: list[str] = []) -> object:
        allQuery = "&".join(query)
        all = "?" + allQuery if allQuery else allQuery
        url = f"{self.url}/connect/profile/Profile{all}"
        self.logger.info('*** searchProfileByHsdpId url=%s' % (url))
        payload = ""
        headers = self._build_headers(token)
        response = self.client.get(
            url, data=payload, headers=headers
            , name="advSearchProfile"
        )
        expect(response.status_code).to(be(200))
        return response.json()

    def searchProfileById(self, token: str, hsdp_id) -> object:
        url = f"{self.url}/connect/profile/Profile?_count=10&hspdId={hsdp_id}"
        self.logger.info('*** searchProfileByHsdpId url=%s' % (url))
        payload = ""
        headers = self._build_headers(token)
        response = self.client.get(
            url, data=payload, headers=headers, name="searchProfileById")
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
        headers = self._build_headers(token)
        response = self.client.post(url, data=str(
            payload), headers=headers
            , name="createProfile"
        )
        expect(response.status_code).to(be(201))
        data = response.json()
        expect(data['HSDPId']).to(equal(hsdp_id))
        return data

    def getProfileById(self, token, hsdp_id):
        url = self.url + "/connect/profile/Profile/" + hsdp_id
        self.logger.info('*** getProfileById url=%s hsdpId=%s' %
                         (url, hsdp_id))
        payload = ""
        headers = self._build_headers(token)
        response = self.client.get(url, data=str(
            payload), headers=headers
            , name="getProfileById"
        )
        expect(response.status_code).to(be(200))
        data = response.json()
        expect(data['HSDPId']).to(equal(hsdp_id))
        return data

    def deleteProfileById(self, token, hsdpId):
        url = self.url + f"/connect/profile/Profile/{hsdpId}"
        self.logger.info('*** deleteProfileById url=%s' % (url))
        headers = self._build_headers(token)
        response = self.client.delete(
            url, headers=headers, name="deleteProfile")
        expect(response.status_code).to(be(200))

    def updateProfileCustomAttributes(self, token, hsdp_id, custom_attributes, etag_version):
        url = self.url + \
            f"/connect/profile/Profile/{hsdp_id}/$update-customattributes"
        headers = self._build_headers(token, etag_version=etag_version)
        self.logger.info('*** updateProfileCustomAttributes url=%s headers=%s data=%s etag=%s' %
                         (url, headers, custom_attributes, etag_version))
        response = self.client.put(
            url, headers=headers, data=str(custom_attributes)
            , name="updateProfileCustomAttributes"
        )
        expect(response.status_code).to(be(200))

    def updateProfileFirmwares(self, token, hsdp_id, firmware_attributes, etag_version):
        url = self.url + \
            f"/connect/profile/Profile/{hsdp_id}/$update-firmwares"
        headers = self._build_headers(token, etag_version=etag_version)
        self.logger.info('*** updateProfileFirmwares url=%s headers=%s data=%s etag=%s' %
                         (url, headers, firmware_attributes, etag_version))
        response = self.client.put(
            url, headers=headers, data=str(firmware_attributes)
            , name="updateProfileFirmwares"
            )
        expect(response.status_code).to(be(200))

    def updateConnectionStatus(self, token, hsdp_id, connection_status, etag_version):
        url = self.url + \
            f"/connect/profile/Profile/{hsdp_id}/$update-connectionstatus"
        headers = self._build_headers(token, etag_version=etag_version)
        self.logger.info('*** updateConnectionStatus url=%s headers=%s data=%s etag=%s' %
                         (url, headers, connection_status, etag_version))
        response = self.client.put(
            url, headers=headers, data=str(connection_status)
            , name="updateConnectionStatus"
            )
        expect(response.status_code).to(be(200))
        return response.json()

    @staticmethod
    def _build_headers(token, etag_version=None, api_version=2):
        headers = {
            'Content-Type': "application/json",
            'API-Version': f"{api_version}",
            'Authorization': "Bearer " + token,
            'Accept': "application/json",
            'Cache-Control': "no-cache"
        }
        if etag_version is not None:
            headers['If-match'] = f"W/{etag_version}"
        return headers
