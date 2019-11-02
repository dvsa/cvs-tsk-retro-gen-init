import {SQService} from "../../src/services/SQService";
import {SQMockClient} from "../models/SQMockClient";
import {StreamService} from "../../src/services/StreamService";
import {PromiseResult} from "aws-sdk/lib/request";
import {ReceiveMessageResult, SendMessageResult} from "aws-sdk/clients/sqs";
import {AWSError} from "aws-sdk";
import event from "../resources/stream-event.json";

describe("retro-gen-init", () => {
    let processedEvent: any;

    context("StreamService", () => {
        const expectedResult: any[] = [
            {
                id: "5e4bd304-446e-4678-8289-d34fca9256e9",
                activityType: "visit",
                testStationName: "Rowe, Wunsch and Wisoky",
                testStationPNumber: "87-1369569",
                testStationEmail: "teststationname@dvsa.gov.uk",
                testStationType: "gvts",
                testerName: "Gica",
                testerStaffId: "132",
                startTime: "2019-02-13T09:27:21.077Z",
                endTime: "2019-02-12T15:25:27.077Z"
            }
        ];

        context("when fetching an activity stream with both visits and wait times", () => {
            it("should result in an array of filtered js objects containing only visits", () => {
                processedEvent = StreamService.getVisitsStream(event);
                expect(processedEvent).toEqual(expectedResult);
            });
        });
    });

    context("SQService", () => {
        // @ts-ignore
        const sqService: SQService = new SQService(new SQMockClient());
        sqService.sqsClient.createQueue({
            QueueName: "retro-gen-q"
        });

        context("when adding a record to the queue", () => {
            it("should successfully add the records to the queue", () => {
                const sendMessagePromises: Array<Promise<PromiseResult<SendMessageResult, AWSError>>> = [];

                processedEvent.forEach(async (record: any) => {
                    sendMessagePromises.push(sqService.sendMessage(JSON.stringify(record)));
                });

                expect.assertions(0);
                return Promise.all(sendMessagePromises)
                .catch((error: AWSError) => {
                    expect(error).toBeFalsy();
                });
            });

            it("should successfully read the added records from the queue", () => {
                return sqService.getMessages()
                .then((messages: ReceiveMessageResult) => {
                    expect(messages.Messages!.map((message) => JSON.parse(message.Body as string))).toEqual(processedEvent);
                });
            });
        });
    });
});
