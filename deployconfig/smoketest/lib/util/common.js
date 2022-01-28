'use strict';

function sleep(ms) {
	return new Promise(resolve => {
		setTimeout(resolve, ms);
	});
}

function buildHeaders(api_version, token, ifMatch = null) {
	const headers = {
		'Content-Type': "application/json",
		'API-Version': `${api_version}`,
		'Authorization': "Bearer " + token,
		'Accept': "application/json"
	};
	if (ifMatch != null) {
		headers['If-match'] = ifMatch;
	}
	return headers;
}

/**
 * header to generate MDM token
 * @param {string} authToken 
 * @returns string - accesstoken
 */
function buildMdmHeader(authToken){
	const headers = {
		'api-version': '1',
		'Content-Type': 'application/x-www-form-urlencoded',
		Authorization: `Bearer ${authToken}`,
		Accept: 'application/json'
	  };
	  return headers;
}
module.exports = {
	sleep,
	buildHeaders,
	buildMdmHeader
};
