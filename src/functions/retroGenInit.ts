import {Callback, Context, DynamoDBRecord, Handler} from "aws-lambda";
import {AWSError} from "aws-sdk";
import {Injector} from "../models/injector/Injector";
import {SQService} from "../services/SQService";
import {PromiseResult} from "aws-sdk/lib/request";
import {SendMessageResult} from "aws-sdk/clients/sqs";
import {StreamService} from "../services/StreamService";

/**
 * λ function to process a DynamoDB stream of test results into a queue for certificate generation.
 * @param event - DynamoDB Stream event
 * @param context - λ Context
 * @param callback - callback function
 */
const retroGenInit: Handler = async (event: any, context?: Context, callback?: Callback): Promise<void | Array<PromiseResult<SendMessageResult, AWSError>>> => {
    if (!event) {
        console.error("ERROR: event is not defined.");
        return;
    }

    // Convert the received event into a readable array of filtered visits
    const records: DynamoDBRecord[] = StreamService.getVisitsStream(event);

    // Instantiate the Simple Queue Service
    const sqService: SQService = Injector.resolve<SQService>(SQService);
    const sendMessagePromises: Array<Promise<PromiseResult<SendMessageResult, AWSError>>> = [];

    // Add each record to the queue
    records.forEach(async (record: any) => {
        sendMessagePromises.push(sqService.sendMessage(JSON.stringify(record)));
    });

    return Promise.all(sendMessagePromises)
        .catch((error: AWSError) => {
            console.error(error);
            console.log("records");
            console.log(records);
            // Lambda will retry up to X times or until the message expires, after which the message will be sent to the dlq.
            throw error;
        });
};

export {retroGenInit};
