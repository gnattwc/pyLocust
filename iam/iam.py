from iam.iamsvc import IamSvc

class Iam:
    def __init__(self, url, client, tokenCreds, logger):
        self.iamsvc = IamSvc(url, client, tokenCreds, logger)
        self.logger = logger
        self.accessToken = None

    def getAccessToken(self):
        self.logger.info("Iam:getAccessToken")
        try:
            if self.accessToken is None:
                self.accessToken = self.iamsvc.getAccessToken()
            return self.accessToken
        except AssertionError as e:
            self.logger.error(e)