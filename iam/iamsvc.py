from expects import *

class IamSvc:
    def __init__(self, url, client, tokenCreds, logger):
        self.url = url
        self.client = client
        self.grantUser, self.grantPass, self.clientUser, self.clientPass = tokenCreds
        self.logger = logger

    def getAccessToken(self):
        url = self.url+'/authorize/oauth2/token'
        self.logger.info(f"*** getAccessToken iamUrl={url} grantUser={self.grantUser} clientUser={self.clientUser}")
        payload = f"grant_type=password&username={self.grantUser}&password={self.grantPass}"
        headers = {
            'api-version': "1",
            'Content-Type': "application/x-www-form-urlencoded",
            'Cache-Control': "no-cache"
        }
        response = self.client.post(
            url, data=payload, headers=headers, auth=(self.clientUser, self.clientPass))
        expect(response.status_code).to(be(200))
        data = response.json()
        accessToken = data['access_token']
        return accessToken
