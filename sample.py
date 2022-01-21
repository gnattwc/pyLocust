from locust import HttpLocust, TaskSet, task, between

class TestCases(TaskSet):
    def on_start(self):
        self.payload = {"email": "john@example.com", "password":123}
        self.login()

    def on_stop(self):
        self.logout()

    def login(self):
        self.client.post("login", self.payload)

    def logout(self):
        self.client.post("logout", self.payload)

    @task(2)
    def visit_count(self):
        self.client.get("visit")

    @task(1)
    def profile(self):
        self.client.get("profile")

class LocustUsers(HttpLocust):
    task_set = TestCases
    wait_time = between(5, 9)