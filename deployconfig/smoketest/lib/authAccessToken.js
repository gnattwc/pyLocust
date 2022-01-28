'use strict';

const request = require('request');
const debugLog = require('debug')('info');
const jwt = require('jsonwebtoken');

function checkStringObject(inputData) {
  if (typeof (inputData) === 'string') {
    try {
      return JSON.parse(inputData);
    } catch (err) {
      return new Error(`checkStringObject: ${JSON.stringify(err)}`);
    }
  }
  return JSON.parse(inputData);
}

function getClientToken(iamUrl, clientId, clientSecret) {
  if (!iamUrl) {
    throw new Error('iamUrl is required');
  }
  if (!clientId) {
    throw new Error('clientId is required');
  }
  if (!clientSecret) {
    throw new Error('clientSecret is required');
  }

  const secretBase64 = new Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  return new Promise((resolve, reject) => {
    const options = {
      url: `${iamUrl}/authorize/oauth2/token`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${secretBase64}`,
        Accept: 'application/json'
      },
      body: `grant_type=client_credentials`
    };

    request.post(options, (error, response, body) => {
      debugLog(`getClientToken Body=${body}`);
      if (error) {
        return reject(error);
      }
      const accessTokenBody = JSON.parse(body);
      return resolve(accessTokenBody);
    });

  });
}

function getAccessToken(iamUrl, clientId, clientSecret, userId, userPassword) {
  debugLog([iamUrl, clientId, userId]);
  if (!iamUrl) {
    throw new Error('iamUrl is required');
  }
  if (!clientId) {
    throw new Error('clientId is required');
  }
  if (!clientSecret) {
    throw new Error('clientSecret is required');
  }
  if (!userId) {
    throw new Error('userId is required');
  }
  if (!userPassword) {
    throw new Error('userPassword is required');
  }
  return new Promise((resolve, reject) => {
    let requestBody = `grant_type=password&username=${userId}&password=${userPassword}`;
    // if (this.iamScope) {
    //     requestBody += `&scope=${this.iamScope}`;
    // }
    const authorizationHeader = new Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const options = {
      url: `${iamUrl}/authorize/oauth2/token`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${authorizationHeader}`,
        Accept: 'application/json'
      },
      body: requestBody
    };
    request.post(options, (error, response, body) => {
      debugLog(`getAccessToken response=${JSON.stringify(response)}`);
      if (!error && response.statusCode === 200) {
        const tokenResponse = checkStringObject(body);
        debugLog(`IAM access token received: ${tokenResponse}`);
        resolve(tokenResponse);
      }
      reject(new Error('AccessForbiddenError: Forbidden Access'));
    });
  });
}

function getSvcAccountAccessToken(iamUrl, serviceId, privateKey) {
  debugLog([iamUrl, serviceId]);
  if (!iamUrl) {
    throw new Error('iamUrl is required');
  }
  if (!serviceId) {
    throw new Error('serviceId is required');
  }
  if (!privateKey) {
    throw new Error('privateKey is required');
  }
  const fullPrivateKey =
    ['-----BEGIN RSA PRIVATE KEY-----',
      `${privateKey}`,
      '-----END RSA PRIVATE KEY-----']

  // generate jwt token
  const date = new Date();
  date.setHours(date.getHours() + 2);
  const expDate = Math.floor(date / 1000);
  const payload = {
    aud: [`${iamUrl}/oauth2/access_token`],
    iss: serviceId,
    sub: serviceId,
    exp: expDate
  }
  const signOptions = {
    algorithm: "RS256"
  };
  const privateKeyBuff = fullPrivateKey.join().replace(/,/g, '\n');

  const jwtToken = jwt.sign(payload, privateKeyBuff, signOptions);

  return new Promise((resolve, reject) => {
    const options = {
      url: `${iamUrl}/authorize/oauth2/token`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Api-version': 2
      },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwtToken}`
    };

    request.post(options, (error, response, body) => {
      if (error) {
        return reject(error);
      }
      debugLog(`getSvcAccountAccessToken Body=${response.body}`);
      const accessTokeBody = JSON.parse(response.body);
      return resolve(accessTokeBody['access_token']);
    });
  });
}

module.exports = { getAccessToken, getSvcAccountAccessToken, getClientToken };
