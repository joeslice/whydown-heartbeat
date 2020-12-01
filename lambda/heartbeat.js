const AWSXRay = require('aws-xray-sdk-core')
const AWS = AWSXRay.captureAWS(require('aws-sdk'))
const db = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();

const checkinTable = process.env.CHECKIN_TABLE_NAME;
const backTable = process.env.BACK_TABLE_NAME;
const snsTopic = process.env.SNS_TOPIC_ARN;

exports.checkin = async function(event) {
    console.log("request", JSON.stringify(event, undefined, 2));
    const { queryStringParameters, pathParameters } = event;
    
    if (queryStringParameters['pingId'] && pathParameters['reporter']) {
        const { pingId } = queryStringParameters;
        const { reporter } = pathParameters;

        const updateParams = {
            TableName: checkinTable,
            Key: {
                reporter: reporter
            },
            UpdateExpression: `set lastPing = :pingId , checkinTime = :checkinTime`,
            ExpressionAttributeValues: {
                ':pingId': pingId,
                ':checkinTime': Date.now()/1000
            }
        };
        
        await db.update(updateParams, function (err, data) {
            if (err) console.log(err, updateParams);
        }).promise();
        return { statusCode: 204, body: '' };
    } else {
        return { statusCode: 400 }
    }
};

exports.back = async function(event) {
    console.log("request", JSON.stringify(event, undefined, 2));
    const { queryStringParameters, pathParameters } = event;

    if (pathParameters['reporter']) {
        const { reporter } = pathParameters;
        const { outage, missed } = queryStringParameters;

        await Promise.all([
            db.put({
                TableName: backTable,
                Item: {
                    reporter: reporter,
                    checkinTime: Date.now()/1000,
                    outage: outage,
                    missed: missed
                }
            }).promise(),

            await sns.publish({
                Message: JSON.stringify({
                    reporter: reporter,
                    outage: outage,
                    missed: missed
                }),
                TopicArn: snsTopic
            }).promise()
        ]);
        return { statusCode: 204 };
    } else {
        return { statusCode: 400 };
    }
};