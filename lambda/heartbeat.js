const AWSXRay = require('aws-xray-sdk-core')
const AWS = AWSXRay.captureAWS(require('aws-sdk'))
const db = new AWS.DynamoDB.DocumentClient();

const tableName = process.env.TABLE_NAME;

exports.checkin = async function(event) {
    console.log("table", tableName, "request", JSON.stringify(event, undefined, 2));
    const { queryStringParameters, pathParameters } = event;
    
    if (queryStringParameters['pingId'] && pathParameters['reporter']) {
        const { pingId } = queryStringParameters;
        const { reporter } = pathParameters;

        const params = {
            TableName: tableName,
            Key: {
                reporter: reporter
            },
            UpdateExpression: `set lastPing = :pingId , checkinTime = :checkinTime`,
            ExpressionAttributeValues: {
                ':pingId': pingId,
                ':checkinTime': Date.now()
            }
        };
        
        try {
            await db.update(params, function (err, data) {
                if (err) console.log(err, params);
            }).promise();
            return { statusCode: 204, body: '' };
        }
        catch (dbError) {
            console.log("ERROR:", JSON.stringify(dbError));
            return { statusCode: 500 };
        }
    } else {
        return {
            statusCode: 400
        }
    }
};

exports.back = async function(event) {
    console.log("request", JSON.stringify(event, undefined, 2));

    const { protocol, sourceIp, userAgent } = event.requestContext.http;

    return {
        statusCode: 200,
        headers: { "Content-Type": "text/plain" },
        body: `Back recorded ${protocol} to ${userAgent} from ${sourceIp}\n`
    }
};