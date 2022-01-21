import requests

class ProvisioningSvc:
    def __init__(self, url:str, token:str):
        self.url = url
        self.token = token

    def set_token(self, token:str):
        self.token = token

    def unprovision(self, hsdp_id:str) -> bool:
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
            'authorization': f"Bearer {self.token}",
            'Accept': "application/json"
        }
        response = requests.request(
            "POST", self.url, data=payload, headers=headers)

        print(response.json())
        return response.status_code == 204
