from locust import HttpUser, task, events, between
from deployconfig import Config
from iam import Iam
from profilesvc import ProfileSvc
from profile import Profile, ProfileFactory
import logging, sys, time

@events.init_command_line_parser.add_listener
def _(parser):
    parser.add_argument("--path-to-config", type=str, env_var="LOCUST_PATH_TO_CONFIG", default="deployconfig/deploy_config_test.json", help="path to deploy config file")

@events.test_start.add_listener
def _(environment, **kw):
    print("Deploy Config: %s" % environment.parsed_options.path_to_config)


class LifeCycleUser(HttpUser):
    def on_start(self):
        self.config = Config(self.environment.parsed_options.path_to_config)
        logging.basicConfig(stream=sys.stdout, encoding='utf-8', level=logging.ERROR)
        self.logger = logging.getLogger("LifeCycleUser")

        self.iam = Iam(self.config["iamUrl"], self.client, self.config["accessTokenCreds"], self.logger)
        self.psvc = ProfileSvc(self.config["profileUrl"], self.client, self.logger)
        self.factory = ProfileFactory(self.client, self.iam, self.psvc, self.config['smokeDeviceTH'], self.logger)

    @task
    def lifecycle(self):
        p = self.factory.createNewProfile()
        time.sleep(1)
        p.refreshData()
        time.sleep(1)
        p.deleteProfile()
        time.sleep(1)

    # wait_time = between(0.5, 2)
