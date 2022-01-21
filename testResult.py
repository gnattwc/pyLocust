class TestResult:
    def __init__(self, name, status, executionTime, responseTime, endpoint):
        self.name = name
        self.status = status
        self.executionTime = executionTime
        self.responseTime = responseTime
        self.endpoint = endpoint
    
    