## PRF Performance Test using Locust
https://locust.io/


## setup
- install python - e.g. https://www.anaconda.com/products/individual
- activate virtualenv
- ```pip install -r requirements.txt```

## to run
to see available users
- ```locust --config locust_prf_dev-int.conf -l```

examples:
- ```locust --config locust_prf_dev-int.conf --loglevel ERROR ReadOnlyUser```
- ```locust --config locust_prf_dev-int.conf CreateOnlyUser```
- ```locust --config locust_prf_beta.conf LifeCycleUser```
