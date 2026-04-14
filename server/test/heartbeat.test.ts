import { expect as expectCDK, haveResource } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as Heartbeat from '../lib/heartbeat-stack';

let stack: cdk.Stack;

beforeAll(() => {
  const app = new cdk.App();
  stack = new Heartbeat.HeartbeatStack(app, 'MyTestStack');
});

test('creates checkin DynamoDB table', () => {
  expectCDK(stack).to(haveResource('AWS::DynamoDB::Table', {
    TableName: 'checkin',
    BillingMode: 'PAY_PER_REQUEST'
  }));
});

test('creates outage DynamoDB table', () => {
  expectCDK(stack).to(haveResource('AWS::DynamoDB::Table', {
    TableName: 'outage',
    BillingMode: 'PAY_PER_REQUEST'
  }));
});

test('creates checkin and query Lambda functions', () => {
  expectCDK(stack).to(haveResource('AWS::Lambda::Function', {
    Handler: 'heartbeat.checkin'
  }));
  expectCDK(stack).to(haveResource('AWS::Lambda::Function', {
    Handler: 'heartbeat.query'
  }));
});

test('creates HTTP API', () => {
  expectCDK(stack).to(haveResource('AWS::ApiGatewayV2::Api', {
    Name: 'heartbeat',
    ProtocolType: 'HTTP'
  }));
});

test('creates SNS topic for outage alerts', () => {
  expectCDK(stack).to(haveResource('AWS::SNS::Topic', {
    DisplayName: '[Checkin] Reporter outage'
  }));
});
