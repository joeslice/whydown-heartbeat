import * as cdk from '@aws-cdk/core';
import { HttpApi } from '@aws-cdk/aws-apigatewayv2';
import { LambdaProxyIntegration } from '@aws-cdk/aws-apigatewayv2-integrations';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';

const PARTITION_KEY = 'reporter';
const SORT_KEY = 'checkinTime';

export class HeartbeatStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, 'CheckinTable', {
      partitionKey: {
        name: PARTITION_KEY,
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: 'checkins'
    });

    const checkin = new lambda.Function(this, 'CheckinLambda', {
      code: lambda.Code.fromAsset('lambda'),
      handler: 'heartbeat.checkin',
      runtime: lambda.Runtime.NODEJS_10_X,
      environment: {
        TABLE_NAME: table.tableName,
        PARTITION_KEY: PARTITION_KEY,
        SORT_KEY: SORT_KEY
      },
      tracing: lambda.Tracing.ACTIVE
    });

    table.grantWriteData(checkin);

    const api = new HttpApi(this, 'Api', {
      apiName: 'heartbeat'
    });

    api.addRoutes({
      path: "/{reporter}/checkin",
      integration: new LambdaProxyIntegration({
        handler: checkin
      })
    });
  }
}
