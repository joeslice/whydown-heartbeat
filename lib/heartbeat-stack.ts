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

    const checkinTable = new dynamodb.Table(this, 'CheckinTable', {
      partitionKey: {
        name: PARTITION_KEY,
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: 'checkins'
    });

    const backTable = new dynamodb.Table(this, 'BackTable', {
      partitionKey: {
        name: PARTITION_KEY,
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: SORT_KEY,
        type: dynamodb.AttributeType.NUMBER
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: 'back'
    });

    const lambdaEnvironment = {
      CHECKIN_TABLE_NAME: checkinTable.tableName,
      BACK_TABLE_NAME: backTable.tableName,
      PARTITION_KEY: PARTITION_KEY,
      SORT_KEY: SORT_KEY
    };

    const lambdaCode = lambda.Code.fromAsset('lambda');

    const checkinLambda = new lambda.Function(this, 'CheckinLambda', {
      code: lambdaCode,
      handler: 'heartbeat.checkin',
      runtime: lambda.Runtime.NODEJS_10_X,
      environment: lambdaEnvironment,
      tracing: lambda.Tracing.ACTIVE
    });

    checkinTable.grantWriteData(checkinLambda);

    const backLambda = new lambda.Function(this, 'BackLambda', {
      code: lambdaCode,
      handler: 'heartbeat.back',
      runtime: lambda.Runtime.NODEJS_10_X,
      environment: lambdaEnvironment,
      tracing: lambda.Tracing.ACTIVE
    });

    backTable.grantWriteData(backLambda);

    const api = new HttpApi(this, 'Api', {
      apiName: 'heartbeat'
    });

    api.addRoutes({
      path: "/{reporter}/checkin",
      integration: new LambdaProxyIntegration({
        handler: checkinLambda
      })
    });

    api.addRoutes({
      path: "/{reporter}/back",
      integration: new LambdaProxyIntegration({
        handler: backLambda
      })
    });
  }
}
