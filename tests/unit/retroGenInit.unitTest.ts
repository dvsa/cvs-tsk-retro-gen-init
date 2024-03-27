import { SQService } from "../../src/services/SQService";
import { StreamService } from "../../src/services/StreamService";
import { SendMessageResult } from "aws-sdk/clients/sqs";
import event from "../resources/stream-event.json";
import { CreateQueueCommand, ReceiveMessageCommandOutput, SQSClient } from "@aws-sdk/client-sqs";

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
        endTime: "2019-02-12T15:25:27.077Z",
      },
    ];

    context(
      "when fetching an activity stream with both visits and wait times",
      () => {
        it("should result in an array of filtered js objects containing only visits", () => {
          processedEvent = StreamService.getVisitsStream(event as any);
          console.log(processedEvent[0].id + '--------');
          
          expect(processedEvent).toEqual(expectedResult);
        });
      }
    );
  });

  describe("SQService", () => {
    const sqsClient = new SQSClient({});
    const sqService: SQService = new SQService(sqsClient);
    // @ts-ignore
    beforeEach(async() =>{

      const command = new CreateQueueCommand({
        QueueName: "retro-gen-q",
      });
      const response = await sqService.sqsClient.send(command);
      
    });

    it("should successfully add the records to the queue", async () => {
      const sendMessagePromises: Array<
        Promise<SendMessageResult>
      > = [];

      processedEvent.forEach(async (record: any) => {
        sendMessagePromises.push(
          sqService.sendMessage(JSON.stringify(record))
        );
      });

      await Promise.all(sendMessagePromises).catch((error: Error) => {
        throw error;
      });
  

      expect(true).toBe(true);
    });

    it("should successfully read the added records from the queue", () => {
      return sqService
        .getMessages()
        .then((messages: ReceiveMessageCommandOutput) => {
          expect(
            messages.Messages!.map((message) =>
              JSON.parse(message.Body as string)
            )
          ).toEqual(processedEvent);
        });
    });

  });
});
