import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as Heartbeat from '../lib/heartbeat-stack';

let template: Template;

beforeAll(() => {
  const app = new cdk.App();
  const stack = new Heartbeat.HeartbeatStack(app, 'MyTestStack');
  template = Template.fromStack(stack);
});

test('creates checkin DynamoDB table', () => {
  template.hasResourceProperties('AWS::DynamoDB::Table', {
    TableName: 'checkin',
    BillingMode: 'PAY_PER_REQUEST'
  });
});

test('creates outage DynamoDB table', () => {
  template.hasResourceProperties('AWS::DynamoDB::Table', {
    TableName: 'outage',
    BillingMode: 'PAY_PER_REQUEST'
  });
});

test('creates checkin and query Lambda functions on Node 20', () => {
  template.hasResourceProperties('AWS::Lambda::Function', {
    Handler: 'heartbeat.checkin',
    Runtime: 'nodejs20.x'
  });
  template.hasResourceProperties('AWS::Lambda::Function', {
    Handler: 'heartbeat.query',
    Runtime: 'nodejs20.x'
  });
});

test('creates HTTP API', () => {
  template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
    Name: 'heartbeat',
    ProtocolType: 'HTTP'
  });
});

test('creates SNS topic for outage alerts', () => {
  template.hasResourceProperties('AWS::SNS::Topic', {
    DisplayName: '[Checkin] Reporter outage'
  });
});
