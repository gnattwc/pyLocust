import os
import random
from typing import ClassVar
from locust import HttpUser, task, events, between
from deployconfig import Config
from iam import Iam
from profilesvc import ProfileSvc
from profile import Profile, ProfileFactory
import logging
import sys
import time
from threading import Lock


@events.init_command_line_parser.add_listener
def _(parser):
    parser.add_argument("--path-to-config", type=str, env_var="LOCUST_PATH_TO_CONFIG",
                        default="", help="path to deploy config file")
    # default="deployconfig/deploy_config_test.json", help="path to deploy config file")


@events.test_start.add_listener
def _(environment, **kw):
    path_to_config = environment.parsed_options.path_to_config
    print("Deploy Config: %s" % path_to_config)
    # config = Config(path_to_config)
    # environment = config['profileUrl']


class BasePerfUser(HttpUser):
    def on_start(self):
        self.config = Config(self.environment.parsed_options.path_to_config)
        logging.basicConfig(stream=sys.stdout,
                            encoding='utf-8', level=logging.INFO)
        self.logger = logging.getLogger(os.path.basename(__file__))
        iamUrl = self.config["iamUrl"]
        profileUrl = self.config["profileUrl"]

        self.iam = Iam(iamUrl, self.client,
                       self.config["accessTokenCreds"], self.logger)
        self.psvc = ProfileSvc(profileUrl, self.client, self.logger)
        self.factory = ProfileFactory(
            self.client, self.iam, self.psvc, self.config['smokeDeviceTH'], self.logger)
        self.profile = None


class CreateOnlyUser(BasePerfUser):
    @task
    def onlyCreate(self):
        self.profile = self.factory.createNewProfile()


class ReadOnlyUser(BasePerfUser):
    lock = Lock()
    read_targets = None

    def find_read_targets(self):
        # thead safety
        ReadOnlyUser.lock.acquire()
        if ReadOnlyUser.read_targets is None:
            self.profile = self.factory.createBlankProfile()
            data = self.profile.search(
                [f"devicetypename={self.config['smokeDeviceType']}", f"_count={100}"])
            ReadOnlyUser.read_targets = list(e['resource']['hsdpId']
                                             for e in data['entry'])
        ReadOnlyUser.lock.release()

    def on_start(self):
        super().on_start()
        self.find_read_targets()

    @task
    def onlyRead(self):
        hsdp_id = random.choice(ReadOnlyUser.read_targets)
        self.profile = self.factory.createFromExistingProfile(hsdp_id)


class CreateReadDeleteUser(BasePerfUser):
    def on_stop(self):
        self.profile.delete()

    @task
    def createReadDelete(self):
        self.profile = Profile = self.factory.createNewProfile()
        self.profile.refreshData()
        self.profile.delete()


class LifeCycleUser(BasePerfUser):
    def on_stop(self):
        self.profile.delete()

    @task
    def lifecycle(self):
        p: Profile = self.factory.createNewProfile()
        time.sleep(1)
        p.refreshData()
        time.sleep(1)
        p.updateCustomAttributes({
            "calories": '175',
            "breakfast": 'chai seed pudding',
            "servingSize": '4 oz'
        })
        time.sleep(1)
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
        time.sleep(1)
        p.updateConnectionStatus({"status": "connected"})
        time.sleep(1)
        # p.searchById( p['HSDPId'])
        # time.sleep(1)
        p.search(
            [f"devicetypename={self.config['smokeDeviceType']}", f"_count=10"])
        time.sleep(1)
        p.delete()
        time.sleep(1)
