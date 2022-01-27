from deployconfig import Config
from iam import Iam
from profilesvc import ProfileSvc
from profile import Profile, ProfileFactory
import argparse
import requests
import logging
import sys
import os
from common import catch_exception

parser = argparse.ArgumentParser()
parser.add_argument('pathToConfig', help='path to deploy config file')
parser.add_argument('command', help='what to do',
                    choices=['get', 'create', 'update'])
parser.add_argument(
    '-m', '--max', help='max to list or unprovision', default=10)
args = parser.parse_args()

logging.basicConfig(stream=sys.stdout, encoding='utf-8', level=logging.INFO)
logger = logging.getLogger(os.path.basename(__file__))

try:
    config = Config(args.pathToConfig)
    with requests.Session() as session:
        iam = Iam(config["iamUrl"], session,
                  config["accessTokenCreds"], logger)
        psvc = ProfileSvc(config["profileUrl"], session, logger)
        factory = ProfileFactory(
            session, iam, psvc, config['smokeDeviceTH'], logger)

        if args.command == 'get' or args.command == 'update':
            p = factory.createEmptyProfile()
            data = p.search(
                [f"devicetypename={config['smokeDeviceType']}", f"_count={args.max}"])
            hsdp_ids = list(e['resource']['hsdpId'] for e in data['entry'])
            logging.info(hsdp_ids)
            p = factory.createFromExistingProfile(hsdp_ids[0])
            logging.info(p)

        if args.command == 'update':
            p.updateCustomAttributes({
                "calories": '175',
                "breakfast": 'chai seed pudding',
                "servingSize": '4 oz'
            })
            logging.info(p)
            p.updateFirmwares([
                {
                    "firmwareComponentId": 'opsSmokeTestCompId',
                    "firmwareComponentName": 'myFirmwareCompdemo',
                    "firmwareVersionId": '40d0fb1a-1c10-4326-9e25-b82813d64f7f',
                    "firmwareVersionName": 'OpsSmokeTestVersion1',
                    "effectiveDate": '2019-11-02T17:30:36.354Z',
                    "downloadedDate": '2019-11-01T17:30:36.354Z',
                    "status": 'downloaded'
                }
            ])
            logging.info(p)
            # p.updateConnectionStatus({"status": "connected"})
            # logging.info(p)

        if args.command == 'create':
            p = factory.createNewProfile()
            logging.info(p)
            p.deleteProfile()
            logging.info(p)


except AssertionError as e:
    logging.error(e)

# if args.command == 'unprovision':
#     provisioning = ProvisioningSvc(config['SmokeTestProvisionUrl'], token)
#     for h in hsdp_ids:
#         logging(f"unprovisioning:{h} ", end="")
#         success = provisioning.unprovision(h)
#         logging("success" if success else "failed")
