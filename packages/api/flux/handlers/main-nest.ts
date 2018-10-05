import * as serverless from 'aws-serverless-express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@n/app.module';
const express = require('express')();

module.exports.nest = async (event, context) => {
    const app = await NestFactory.create(AppModule, express);
    await app.init();
    const server = serverless.createServer(express);
    serverless.proxy(server, event, context);
}
