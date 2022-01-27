from common.dict_base import DictBase
from iam import Iam
from profilesvc import ProfileSvc

class Profile(DictBase):
    def __init__(self, client, iamsvc:Iam, profilesvc:ProfileSvc, device_th, logger, hsdp_id:str=None):
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
        self._dict = self.prf.createProfile(self._getToken(), self.device_th, hsdp_id)
        self.hsdp_id = hsdp_id

    def searchProfile(self, searchTerms: list[str]):
        return self.prf.searchProfile(self._getToken(), searchTerms)

    def deleteProfile(self):
        self.prf.deleteProfileById(self._getToken(), self.hsdp_id)
        self.hsdp_id = None
        self._dict = {}

    def getData(self):
        return self._dict

    # def __str__(self):
    #     return f"hsdpId={self.hsdp_id}\ndata={self.prettyPrint(self._dict)}"
