import json

class DictBase:
    def __init__(self):
        self._dict = {}

    def __getitem__(self, item):
        return self._dict[item]

    def __len__(self):
        return len(self._dict)

    def items(self):
        return self._dict.items()

    def keys(self):
        return self._dict.keys()

    def values(self):
        return self._dict.values()

    def __str__(self):
        return json.dumps(self._dict, indent=4)

    @staticmethod
    def prettyPrint( obj):
        return json.dumps(obj, indent=4)
