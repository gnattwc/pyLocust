import json

def getConfig(path):
    f = open(path, 'r')
    deployConfig = json.load(f)
    return deployConfig

