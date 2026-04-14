import * as cdk from 'aws-cdk-lib';
import { aws_lambda as lambda, aws_dynamodb as dynamodb, aws_sns as sns } from 'aws-cdk-lib';
import { HttpApi } from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import { Construct } from 'constructs';

const PARTITION_KEY = 'reporter';
const SORT_KEY = 'checkinTime';

export class HeartbeatStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const checkinTable = new dynamodb.Table(this, 'CheckinTable', {
      partitionKey: {
        name: PARTITION_KEY,
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: 'checkin'
    });

    const outageTable = new dynamodb.Table(this, 'OutageTable', {
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
      tableName: 'outage'
    });

    const outageTopic = new sns.Topic(this, 'OutageTopic', {
      displayName: '[Checkin] Reporter outage'
    });

    const lambdaEnvironment = {
      CHECKIN_TABLE_NAME: checkinTable.tableName,
      OUTAGE_TABLE_NAME: outageTable.tableName,
      PARTITION_KEY: PARTITION_KEY,
      SORT_KEY: SORT_KEY,
      SNS_TOPIC_ARN: outageTopic.topicArn
    };

    const lambdaCode = lambda.Code.fromAsset('lambda');

    const checkinLambda = new lambda.Function(this, 'CheckinLambda', {
      code: lambdaCode,
      handler: 'heartbeat.checkin',
      runtime: lambda.Runtime.NODEJS_10_X,
      environment: lambdaEnvironment,
      tracing: lambda.Tracing.PASS_THROUGH
    });

    const queryLambda = new lambda.Function(this, 'QueryLambda', {
      code: lambdaCode,
      handler: 'heartbeat.query',
      runtime: lambda.Runtime.NODEJS_10_X,
      environment: lambdaEnvironment,
      tracing: lambda.Tracing.PASS_THROUGH
    });

    checkinTable.grantWriteData(checkinLambda);
    outageTable.grantWriteData(checkinLambda);
    outageTopic.grantPublish(checkinLambda);
    checkinTable.grantReadData(queryLambda);
    outageTable.grantReadData(queryLambda);

    const api = new HttpApi(this, 'Api', {
      apiName: 'heartbeat'
    });

    api.addRoutes({
      path: "/{reporter}/checkin",
      integration: new HttpLambdaIntegration('CheckinIntegration', checkinLambda)
    });

    api.addRoutes({
      path: "/{reporter}/query",
      integration: new HttpLambdaIntegration('QueryIntegration', queryLambda)
    });
  }
}
