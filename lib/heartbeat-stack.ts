import * as cdk from '@aws-cdk/core';
import { HttpApi } from '@aws-cdk/aws-apigatewayv2';
import { LambdaProxyIntegration } from '@aws-cdk/aws-apigatewayv2-integrations';
import * as lambda from '@aws-cdk/aws-lambda';

export class HeartbeatStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const checkin = new lambda.Function(this, 'checkinlambda', {
      code: lambda.Code.fromAsset('lambda'),
      handler: 'heartbeat.checkin',
      runtime: lambda.Runtime.NODEJS_10_X
    });

    const api = new HttpApi(this, 'api', {
      apiName: 'heartbeat'
    });

    api.addRoutes({
      path: "/checkin",
      integration: new LambdaProxyIntegration({
        handler: checkin
      })
    })
  }
}
