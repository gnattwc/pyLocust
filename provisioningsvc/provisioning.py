from expects import *
class ProvisioningSvc:
    def __init__(self, url:str, client):
        self.url = url
        self.client = client

    def unprovision(self, token:str, hsdp_id:str) -> bool:
        obj = {
            "resourceType": "Identity",
            "identifier": {
                "system": "http://",
                "value": hsdp_id
            }
        }
        payload = repr(obj)
        print(payload)
        headers = {
            "api-version": "1",
            'authorization': f"Bearer {token}",
            'Accept': "application/json"
        }
        response = self.client.post(
            self.url, data=payload, headers=headers)

        expect(response.status_code).to(be(204))
        return response.json()
