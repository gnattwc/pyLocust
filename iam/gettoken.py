import requests

def getAccessToken(iamUrl, grantUser, grantPass, clientUser, clientPass):
    url = iamUrl+'/authorize/oauth2/token'
    print(f"*** getAccessToken iamUrl={url} grantUser={grantUser} clientUser={clientUser}")
    payload = f"grant_type=password&username={grantUser}&password={grantPass}"
    headers = {
        'api-version': "1",
        'Content-Type': "application/x-www-form-urlencoded",
        'Cache-Control': "no-cache"
    }
    response = requests.request(
        "POST", url, data=payload, headers=headers, auth=(clientUser, clientPass))
    if (response.status_code == 200):
        data = response.json()
        accessToken = data['access_token']
        print ("Passed: getAccessToken")
        return accessToken
    else:
        print ("Failed: getAccessToken: "+response.text)
        return None
