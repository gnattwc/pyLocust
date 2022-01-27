import json
from operator import itemgetter
from common.dict_base import DictBase

class Config(DictBase):
    def __init__(self, path: str):
        super().__init__()
        self.path = path
        self.config_raw = self.getConfig(path)
        self._dict = self.parseConfig(self.config_raw)

    @staticmethod
    def getConfig(path):
        with open(path, 'r') as f:
            deployConfig = json.load(f)
        return deployConfig

    @staticmethod
    def parseConfig(config):
        dict = {}
        dict['iamUrl'] = config['IAM_URL']
        dict['accessTokenCreds'] = itemgetter(
            "UserId", "UserPassword", "ClientId", "ClientSecret")(config['SmokeTestDevices'][0])
        dict["profileUrl"] = "https://" + config['DomainName']
        dict["smokeDeviceType"] = config['SmokeTestDeviceType']
        dict["smokeDeviceTH"] = config['SmokeTestDeviceTH'][0]
        return dict

# test code
# if __name__ == '__main__':
#     d = {'a': 1,'b': 2,'c': 3}
#     di = Config(d)

#     print(di.__len__())
#     print(di.items())
#     print(di.keys())
#     print(di.values())
#     print(di.__getitem__('b'))