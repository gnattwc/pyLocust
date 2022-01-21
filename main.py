import iam
import deployconfig
from operator import itemgetter
from profilesvc import ProfileSvc
import argparse
from provisioningsvc import ProvisioningSvc

parser = argparse.ArgumentParser()
parser.add_argument('pathToConfig', help='path to deploy config file')
parser.add_argument('command', help='what to do',
                    choices=['list', 'unprovision'])
parser.add_argument(
    '-m', '--max', help='max to list or unprovision', default=10)
args = parser.parse_args()

prov_creds = {
    "password": "ixJ@#w!AxeX-6.jn",
    "username": "22cb4c6661f24b78907"
}

config = deployconfig.getConfig(args.pathToConfig)

iamUrl = config['IAM_URL']
# uid, upd, cid, cpd = itemgetter("UserId", "UserPassword", "ClientId", "ClientSecret")(config['SmokeTestDevices'][0])
items = itemgetter("UserId", "UserPassword", "ClientId",
                   "ClientSecret")(config['SmokeTestDevices'][0])

token = iam.getAccessToken(iamUrl, *items)

profileUrl = "https://" + config['DomainName']
psvc = ProfileSvc(profileUrl, token)

resp = psvc.searchProfile([
    f"devicetypename={config['SmokeTestDeviceType']}",
    f"_count={args.max}"])
data = resp.json()

hsdp_ids = list(e['resource']['hsdpId'] for e in data['entry'])

if args.command == 'list':
    print(hsdp_ids)

if args.command == 'unprovision':
    provisioning = ProvisioningSvc(config['SmokeTestProvisionUrl'], token)
    for h in hsdp_ids:
        print(f"unprovisioning:{h} ", end="")
        success = provisioning.unprovision(h)
        print("success" if success else "failed")
