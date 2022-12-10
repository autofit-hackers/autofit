#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AbdominalStack } from '../lib/abdominal-stack';

const app = new cdk.App();
new AbdominalStack(app, 'AbdominalStack');
