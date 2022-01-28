import random
from .profile import Profile
import logging
import datetime

class ProfileFactory:
    def __init__(self, client, iam, prf, device_th, logger=logging.getLogger(__name__)):
        self.client = client
        self.iam = iam
        self.prf = prf
        self.device_th = device_th
        self.logger = logger

    def createBlankProfile(self):
        p = Profile( self.client, self.iam, self.prf, self.device_th, self.logger)
        return p

    def createNewProfile(self, prefix="hsdpIdLocust"):
        p = Profile( self.client, self.iam, self.prf, self.device_th, self.logger)
        # hsdp_id = uuid.uuid4()
        now = datetime.datetime.now().strftime('%Y%m%d%H%M%S%f')
        rand = random.randint(0,10000)
        new_hsdp_id = f"{prefix}{now}{rand}"
        p.createNewProfile( new_hsdp_id)
        return p

    def createFromExistingProfile(self, hsdp_id):
        p = Profile( self.client, self.iam, self.prf, self.device_th, self.logger, hsdp_id)
        p.refreshData()
        return p
