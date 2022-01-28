'use strict';

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

const pathToConfig = process.argv[2];
const filepath = pathToConfig;
const rawdata = fs.readFileSync(filepath);
const deployConfig = JSON.parse(rawdata);
const awsRegion = deployConfig.AWS_DEFAULT_REGION; 
const oAuthClientTHTableName_blue = `PRF-MDM-OAuthClientTypeHierarchy-${deployConfig.NODE_ENV}`;
const oAuthClientTHTableName_green = `PRF-MDM-OAuthClientTypeHierarchy-${deployConfig.NODE_ENV}g`;
const docClient = new AWS.DynamoDB.DocumentClient({ region: awsRegion });

async function start() {
  console.log("========= ConnectProfile MDM Sync Data Comparison:");
  console.log(`Table1 (blue) to be compared=${oAuthClientTHTableName_blue}`);
  console.log(`Table2 (green) to be compared=${oAuthClientTHTableName_green}`);

  try {
    console.log(`*** Scan the Table1 (blue) `);
    const p1 = getAllOACTHsData(oAuthClientTHTableName_blue);
    console.log(`*** Scan the Table2 (green) `);
    const p2 =  getAllOACTHsData(oAuthClientTHTableName_green);
    const results = await Promise.all([p1,p2]);

    const table1Result = results[0];
    const table2Result = results[1];
    console.log(`*** Total counts for Table1 (blue) = ${table1Result.length} `);
    const uniqueTable1Result = [...new Set(table1Result)];
    console.log(`*** Total unique counts for Table1 (blue) = ${uniqueTable1Result.length} `);

    console.log(`*** Total counts for Table2 (green) = ${table2Result.length} `);
    const uniqueTable2Result = [...new Set(table2Result)];
    console.log(`*** Total unique counts for Table2 (green) = ${uniqueTable2Result.length} `);

    const hasDifference = doComparison(uniqueTable1Result, uniqueTable2Result);
    return hasDifference;
  } catch (err) {
    console.log(`*** MDM sync comparison failed. err=${err}`);
    throw err;
  }
}

function doComparison(table1Keys, table2Keys) {

  const map1 = new Map();
  const map2 = new Map();

  table1Keys.forEach(key => map1.set(key, true));
  table2Keys.forEach(key => map2.set(key, true));

  // find key in table1 but not in table2
  const missingKey1 = [];
  table1Keys.forEach(key => {
    if (!map2.has(key)) {
      missingKey1.push(key);
    }
  });
  console.log(`total key counts in table1(blue) but not in table2(green)=${missingKey1.length}`)
  if (missingKey1.length > 0) {
    console.log('[deviceType]-[groupName]-[applicationId]-[OAuthClientId]');
    console.dir(missingKey1, { colors: true, maxArrayLength: 1000 });
  }

  // find key in table2 but not in table1
  const missingKey2 = [];
  table2Keys.forEach(key => {
    if (!map1.has(key)) {
      missingKey2.push(key);
    }
  });
  console.log(`total key counts in table2(green) but not in table1(blue)=${missingKey2.length}`)
  if (missingKey2.length > 0) {
    console.log('[deviceType]-[groupName]-[applicationId]-[OAuthClientId]');
    console.dir(missingKey2, { colors: true, maxArrayLength: 1000 });
  }

  return (missingKey1.length > 0 || missingKey2.length > 0);
}

async function getAllOACTHsData(oacTHTableName) {

  // scan to get all items
  const projectExpression = 'deviceType, groupName, applicationId, OAuthClientId';
  let scanAllItemResults = await scanTable(oacTHTableName, null, projectExpression, null, null);
  const TypeAndOAuthClientKeys = [];
  if (scanAllItemResults.Count > 0) {
    for (const item of scanAllItemResults.Items) { // eslint-disable-line
      TypeAndOAuthClientKeys.push(`[${item.deviceType}]-[${item.groupName}]-[${item.applicationId}]-[${item.OAuthClientId}]`);
    }
  }

  // scan additional item if LastEvaluatedKey has value
  while (scanAllItemResults.LastEvaluatedKey) {
    scanAllItemResults = await scanTable(oacTHTableName, scanAllItemResults.LastEvaluatedKey, projectExpression, null, null); // eslint-disable-line
    for (const item of scanAllItemResults.Items) { // eslint-disable-line
      TypeAndOAuthClientKeys.push(`[${item.deviceType}]-[${item.groupName}]-[${item.applicationId}]-[${item.OAuthClientId}]`);
    }
  }

  return TypeAndOAuthClientKeys;
}


function scanTable(tableName, exclusiveStartKey, projectionExpression, expressionAttributeValues, expressionAttributeNames) {
  return new Promise((resolve, reject) => {
    const params = {
      TableName: tableName
    };
    if (exclusiveStartKey) {
      params.ExclusiveStartKey = exclusiveStartKey
    }
    if (projectionExpression) {
      params.ProjectionExpression = projectionExpression;
    }
    if (expressionAttributeValues) {
      params.ExpressionAttributeValues = expressionAttributeValues;
    }
    if (expressionAttributeNames) {
      params.ExpressionAttributeNames = expressionAttributeNames;
    }
    docClient.scan(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}


start().then((hasDifference) => {
  console.log("********* MDM sync data comparison completed!");
  if (hasDifference) {
    process.exit(1);
  } else {
    process.exit();
  }
}).catch((err) => {
  console.log(`error encountered=${err}`);
  process.exit(2);
});