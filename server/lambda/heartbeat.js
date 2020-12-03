const AWSXRay = require('aws-xray-sdk-core')
const AWS = AWSXRay.captureAWS(require('aws-sdk'))
const db = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();

const checkinTable = process.env.CHECKIN_TABLE_NAME;
const outageTable = process.env.OUTAGE_TABLE_NAME;
const snsTopic = process.env.SNS_TOPIC_ARN;

exports.checkin = async function(event) {
    console.log("request", JSON.stringify(event, undefined, 2));
    const { queryStringParameters, pathParameters } = event;
    
    if (queryStringParameters['pingId'] && pathParameters['reporter']) {
        const { pingId, outage, missed} = queryStringParameters;
        const { reporter } = pathParameters;
        
        updates = [
            db.update({
                TableName: checkinTable,
                Key: {
                    reporter: reporter
                },
                UpdateExpression: `set lastPing = :pingId , checkinTime = :checkinTime`,
                ExpressionAttributeValues: {
                    ':pingId': pingId,
                    ':checkinTime': Date.now()/1000
                }
            }).promise()
        ];

        if (outage || missed) {
            updates.push(
                db.put({
                    TableName: outageTable,
                    Item: {
                        reporter: reporter,
                        checkinTime: Date.now()/1000,
                        outage: outage,
                        missed: missed
                    }
                }).promise()
            );
            updates.push(
                sns.publish({
                    Message: JSON.stringify({
                        reporter: reporter,
                        outage: outage,
                        missed: missed
                    }),
                    TopicArn: snsTopic
                }).promise()
            );
        }

        await Promise.all(updates);
        
        return { statusCode: 204, body: '' };
    } else {
        return { statusCode: 400 }
    }
};
