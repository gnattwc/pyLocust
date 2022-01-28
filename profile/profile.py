from common.dict_base import DictBase
from iam import Iam
from profilesvc import ProfileSvc
from common.util import catch_exception

class Profile(DictBase):
    def __init__(self, client, iamsvc: Iam, profilesvc: ProfileSvc, device_th, logger, hsdp_id: str = None):
        self.client = client
        self.logger = logger
        self.iam = iamsvc
        self.prf = profilesvc
        self.device_th = device_th
        self.hsdp_id = hsdp_id

    def _getToken(self):
        return self.iam.getAccessToken()

    def refreshData(self):
        self._dict = self.prf.getProfileById(self._getToken(), self.hsdp_id)

    def createNewProfile(self, hsdp_id):
        self._dict = self.prf.createProfile(
            self._getToken(), self.device_th, hsdp_id)
        self.hsdp_id = hsdp_id

    @catch_exception(AssertionError)
    def search(self, searchTerms: list[str]):
        return self.prf.searchProfile(self._getToken(), searchTerms)

    @catch_exception(AssertionError)
    def searchById(self, hsdp_id:str):
        return self.prf.searchProfileById(self._getToken(), hsdp_id)

    def delete(self):
        if self.hsdp_id is not None:
            self.prf.deleteProfileById(self._getToken(), self.hsdp_id)
            self.hsdp_id = None
            self._dict = {}

    @catch_exception(AssertionError)
    def updateCustomAttributes(self, custom_attributes):
        self.prf.updateProfileCustomAttributes(
            self._getToken(), self.hsdp_id, custom_attributes, self._get_etag())
        self._dict['customAttributes'] = custom_attributes
        self._update_etag(self._get_etag()+1)

    @catch_exception(AssertionError)
    def updateFirmwares(self, firmware_attributes):
        self.prf.updateProfileFirmwares(
            self._getToken(), self.hsdp_id, firmware_attributes, self._get_etag())
        self._dict['firmwares'] = firmware_attributes
        self._update_etag(self._get_etag()+1)

    @catch_exception(AssertionError)
    def updateConnectionStatus(self, connection_status):
        resp = self.prf.updateConnectionStatus(
            self._getToken(), self.hsdp_id, connection_status, self._get_etag())
        self._dict['connectionStatus'] = connection_status
        self._update_etag(self._get_etag()+1)
        return resp

    def getData(self):
        return self._dict

    def _get_etag(self):
        # try to get current etag.  defaults to 1
        return self._dict.get('meta',{}).get('versionId', 1)

    def _update_etag(self, new_tag):
        self._dict['meta']['versionId'] = new_tag

    # def __str__(self):
    #     return f"hsdpId={self.hsdp_id}\ndata={self.prettyPrint(self._dict)}"
