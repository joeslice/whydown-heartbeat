#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { HeartbeatStack } from '../lib/heartbeat-stack';

const app = new cdk.App();
new HeartbeatStack(app, 'HeartbeatStack');
