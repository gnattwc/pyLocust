from deployconfig import Config
from iam import IamSvc
from profilesvc import ProfileSvc
import argparse
import requests
import datetime
import logging, sys

parser = argparse.ArgumentParser()
parser.add_argument('pathToConfig', help='path to deploy config file')
parser.add_argument('command', help='what to do',
                    choices=['get', 'create'])
parser.add_argument(
    '-m', '--max', help='max to list or unprovision', default=10)
args = parser.parse_args()

logging.basicConfig(stream=sys.stdout, encoding='utf-8', level=logging.CRITICAL)
logger = logging.getLogger(__file__)

try:
    config = Config(args.pathToConfig)
    with requests.Session() as session:
        iamsvc = IamSvc(config["iamUrl"], session, config["accessTokenCreds"], logger)
        token = iamsvc.getAccessToken()

        psvc = ProfileSvc(config["profileUrl"], session, logger)

        if args.command == 'get':
            data = psvc.searchProfile(token,
                [f"devicetypename={config['smokeDeviceType']}",f"_count={args.max}"])
            hsdp_ids = list(e['resource']['hsdpId'] for e in data['entry'])
            logging.info(hsdp_ids)

            resp = psvc.getProfileById(token, hsdp_ids[0])
            logging.info(resp)

        if args.command == 'create':
            now = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
            new_hsdp_id = f"hsdpIdLocust{now}"
            resp = psvc.createProfile(token, config['smokeDeviceTH'], new_hsdp_id )
            logging.info(resp)

except AssertionError as e:
    logging.error(e)

# if args.command == 'unprovision':
#     provisioning = ProvisioningSvc(config['SmokeTestProvisionUrl'], token)
#     for h in hsdp_ids:
#         logging(f"unprovisioning:{h} ", end="")
#         success = provisioning.unprovision(h)
#         logging("success" if success else "failed")
