"use strict"

const debugLog = require('debug')('mqtt-connect');
const debugListen = debugLog.extend('listen');

const fs = require("fs")
const NodeRSA = require('node-rsa');
const awsIot = require('aws-iot-device-sdk');
const { getAccessToken } = require('../authAccessToken');

function getTokenSignature(key, token) {
  const privateKey = new NodeRSA(key);
  const byteArr = privateKey.sign(new Buffer.from(token));
  const encByteArr = byteArr.toString('base64');
  return encByteArr;
}

async function getDevice(configObj, deviceObj) {

  const respBody = await getAccessToken(configObj.IamUrl, deviceObj.ClientId, deviceObj.ClientSecret, deviceObj.UserId, deviceObj.UserPassword);
  const iamToken = respBody.access_token;
  const signedToken = ('signed_token' in respBody) ? respBody.signed_token : undefined;
  debugLog(respBody);
  let tokenSignature;
  if (configObj.GatewayKey) {
    tokenSignature = getTokenSignature(configObj.GatewayKey, iamToken);
  } else if (signedToken) {
    tokenSignature = signedToken;
  }

  const headers = {
    "x-amz-customauthorizer-name": configObj.CustomAuthorizerName,
    "AuthorizationToken": iamToken,
    "x-amz-customauthorizer-signature": tokenSignature
  }

  const options = {
    clientId: deviceObj.HsdpId,
    protocol: 'wss-custom-auth',
    customAuthHeaders: headers,
    host: configObj.IotEndpoint,
    debug: true
  };

  debugLog(options);
  const device = awsIot.device(options);

  if (debugListen.enabled) {
    device
      .on('connect', function () {
        console.log('connected to : ' + options.clientId);
      });
    device
      .on('close', function () {
        console.log('close');
      });
    device
      .on('reconnect', function () {
        console.log('reconnect');
      });
    device
      .on('offline', function () {
        console.log('offline');
      });
    device
      .on('error', function (error) {
        console.log('error', error);
      });
    device
      .on('message', function (topic, payload) {
        console.log('message', topic, payload.toString());
      });
  }

  return (device);
}


module.exports = {
  getDevice
}