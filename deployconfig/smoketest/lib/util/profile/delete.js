/*
Getting parameters from settings.json and DELETE cmd
*/
const debugLog = require('debug')('info');

const request = require("request");
const common = require("../common.js");

function deleteProfileByHsdpId(api_version, hsdpId, token, cmd_url) {
  let headers=common.buildHeaders(api_version, token);
  let options = {
    method: 'DELETE',
    url: `${cmd_url}/Profile/${hsdpId}`,
    headers: headers,
    json: true
  };
  //  console.log(options);
  return new Promise(function (resolve, reject) {
    request(options, function (err, resp) {
      if (err) {
        reject(err);
      } else {
        // console.log(resp.body);
        resolve(resp);
      }
    });
  });
}

module.exports = {
  deleteProfileByHsdpId
}