const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, PutCommand, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const db = DynamoDBDocumentClient.from(new DynamoDBClient());
const sns = new SNSClient();

const checkinTable = process.env.CHECKIN_TABLE_NAME;
const outageTable = process.env.OUTAGE_TABLE_NAME;
const snsTopic = process.env.SNS_TOPIC_ARN;
const outageThreshold = parseInt(process.env.OUTAGE_THRESHOLD || '30000');

exports.checkin = async function(event) {
    console.log("request", JSON.stringify(event, undefined, 2));
    const { queryStringParameters, pathParameters } = event;

    if (queryStringParameters?.['pingId'] && pathParameters?.['reporter']) {
        const { pingId, outage, missed } = queryStringParameters;
        const { reporter } = pathParameters;

        const updates = [
            db.send(new UpdateCommand({
                TableName: checkinTable,
                Key: { reporter },
                UpdateExpression: `set lastPing = :pingId , checkinTime = :checkinTime`,
                ExpressionAttributeValues: {
                    ':pingId': pingId,
                    ':checkinTime': Math.floor(Date.now() / 1000)
                }
            }))
        ];

        if (outage || missed) {
            updates.push(
                db.send(new PutCommand({
                    TableName: outageTable,
                    Item: { reporter, checkinTime: Math.floor(Date.now() / 1000), outage: parseInt(outage), missed: parseInt(missed) }
                }))
            );
            if (parseInt(outage) >= outageThreshold) {
                updates.push(
                    sns.send(new PublishCommand({
                        Message: JSON.stringify({ reporter, outage, missed }),
                        TopicArn: snsTopic
                    }))
                );
            }
        }

        await Promise.all(updates);

        return { statusCode: 204, body: '' };
    } else {
        return { statusCode: 400 };
    }
};

exports.query = async function(event) {
    console.log("request", JSON.stringify(event, undefined, 2));
    const { pathParameters } = event;

    if (pathParameters?.['reporter']) {
        const { reporter } = pathParameters;

        const [checkinResult, outageResult] = await Promise.all([
            db.send(new GetCommand({
                TableName: checkinTable,
                Key: { reporter }
            })),
            db.send(new QueryCommand({
                TableName: outageTable,
                KeyConditionExpression: "#reporter = :reporter",
                ExpressionAttributeNames: { "#reporter": "reporter" },
                ExpressionAttributeValues: { ":reporter": reporter }
            }))
        ]);

        console.log("results", JSON.stringify([checkinResult, outageResult], undefined, 2));

        return {
            statusCode: 200,
            body: JSON.stringify({
                checkin: checkinResult.Item,
                outages: outageResult.Items,
                outageCount: outageResult.Count
            })
        };
    } else {
        return { statusCode: 400 };
    }
};
