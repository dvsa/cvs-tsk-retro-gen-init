
import { ServiceException } from "@smithy/smithy-client";

import {
  GetQueueUrlCommand,
  GetQueueUrlCommandOutput,
  MessageAttributeValue,
  ReceiveMessageCommand,
  ReceiveMessageCommandOutput,
  SendMessageCommand,
  SendMessageCommandInput,
  SendMessageCommandOutput,
  SQS,
  SQSClient,
} from "@aws-sdk/client-sqs";
import * as AWSXRay from 'aws-xray-sdk';
import { Service } from "../models/injector/ServiceDecorator";
import { Configuration } from "../utils/Configuration";
import { PromiseResult } from "aws-sdk/lib/request";
import { config as AWSConfig } from "aws-sdk";
/* tslint:disable */
/* tslint:enable */
// const AWSXRay = require('aws-xray-sdk');
/**
 * Service class for interfacing with the Simple Queue Service
 */
@Service()
class SQService {
  public readonly sqsClient: SQSClient;
  private readonly config: any;

  /**
   * Constructor for the ActivityService class
   * @param sqsClient - The Simple Queue Service client
   */
  constructor(sqsClient: SQSClient) {
    const config: any = Configuration.getInstance().getConfig();
    this.sqsClient = AWSXRay.captureAWSv3Client(sqsClient);

    if (!config.sqs) {
      throw new Error("SQS config is not defined in the config file.");
    }

    // Not defining BRANCH will default to local
    const env: string =
      !process.env.BRANCH || process.env.BRANCH === "local"
        ? "local"
        : "remote";
    this.config = config.sqs[env];

    AWSConfig.sqs = this.config.params;
  }

  /**
   * Send a message to the queue
   * @param messageBody - A string message body
   * @param messageAttributes - A MessageAttributeMap
   */
  public async sendMessage(
    messageBody: string,
    messageAttributes?: Record<string, MessageAttributeValue>
  ): Promise<SendMessageCommandOutput> {
    const command = new GetQueueUrlCommand({ QueueName: this.config.queueName });
    // Get the queue URL for the provided queue name
    const queueUrlResult: GetQueueUrlCommandOutput = await this.sqsClient.send(command);
    const params = {
      QueueUrl: queueUrlResult.QueueUrl,
      MessageBody: messageBody,
    };

    if (messageAttributes) {
      Object.assign(params, { MessageAttributes: messageAttributes });
    }
    const sendMessage = new SendMessageCommand(params as SendMessageCommandInput);
    // Send a message to the queue
    return await this.sqsClient.send(sendMessage);
      
  }

  /**
   * Get the messages in the queue
   */
  public async getMessages(): Promise<ReceiveMessageCommandOutput>
   {
    const command = new GetQueueUrlCommand({ QueueName: this.config.queueName });

    // Get the queue URL for the provided queue name
    const queueUrlResult: GetQueueUrlCommandOutput = await this.sqsClient.send(command);

    // Get the messages from the queue
    return this.sqsClient.send(new ReceiveMessageCommand({QueueUrl: queueUrlResult.QueueUrl!}));
  }
}

export { SQService };