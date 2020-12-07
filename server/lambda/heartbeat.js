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

exports.query = async function(event) {
    console.log("request", JSON.stringify(event, undefined, 2));
    const { queryStringParameters, pathParameters } = event;
    if (pathParameters['reporter']) {
        const { reporter } = pathParameters;

        const checkinPromise = db.get({
            TableName: checkinTable,
            Key: {
                reporter: reporter
            }
        }).promise();

        const outagePromise = db.query({
            TableName: outageTable,
            KeyConditionExpression: "#reporter = :rpter",
            ExpressionAttributeNames: {
                "#reporter": "reporter"
            },
            ExpressionAttributeValues: {
                ":rpter": reporter
            }
        }).promise();

        const results = await Promise.all([checkinPromise, outagePromise]);
        console.log("results", JSON.stringify(results, undefined, 2));

        return {
            statusCode: 200,
            body: JSON.stringify({
                checkin: results[0].Item,
                outages: results[1].Items,
                outageCount: results[1].Count
            })
        };
    }
}
