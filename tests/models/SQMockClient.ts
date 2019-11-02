import {AWSError} from "aws-sdk";
import SQS, {CreateQueueRequest} from "aws-sdk/clients/sqs";

interface IQueue {
    queueName: string;
    queueURL: string;
    queueMessages: string[];
}

class SQMockClient {
    private readonly queues: IQueue[] = [];

    /**
     * unused
     * @param queue
     */
    public createQueue(queue: CreateQueueRequest) {
        this.queues.push({
            queueName: queue.QueueName,
            queueURL: `sqs://queue/${queue.QueueName}`, // This is a mock value. It doesn't mean anything.
            queueMessages: []
        });
    }

    /**
     * Get a mock queue URL
     * @param params - GetQueueUrlRequest parameters
     * @param callback - optional callback function
     */
    public getQueueUrl(params: SQS.Types.GetQueueUrlRequest, callback?: (err: AWSError, data: SQS.Types.GetQueueUrlResult) => void): any {
        return {
            promise: () => {
                return new Promise((resolve, reject) => {
                    const foundQueue = this.queues.find((queue) => queue.queueName === params.QueueName);

                    if (foundQueue) {
                        resolve({ QueueUrl: foundQueue.queueURL });
                    }

                    reject(new Error(`Queue ${params.QueueName} was not found.`));
                });
            }
        };
    }

    /**
     * Send a message to the mock queue
     * @param params - SendMessageRequest parameters
     * @param callback - optional callback function
     */
    public sendMessage(params: SQS.Types.SendMessageRequest, callback?: (err: AWSError, data: SQS.Types.SendMessageResult) => void): any {
        return {
            promise: () => {
                return new Promise((resolve, reject) => {
                    const foundQueue = this.queues.find((queue) => queue.queueURL === params.QueueUrl);

                    if (foundQueue) {
                        foundQueue.queueMessages.push(params.MessageBody);
                        resolve({
                            MessageId: "mock"
                        });
                    }

                    reject(new Error(`Queue ${params.QueueUrl} was not found.`));
                });
            }
        };
    }

    /**
     * Get messages from the mock queue
     * @param params - ReceiveMessageRequest parameters
     * @param callback - optional callback function
     */
    public receiveMessage(params: SQS.Types.ReceiveMessageRequest, callback?: (err: AWSError, data: SQS.Types.ReceiveMessageResult) => void): any {
        return {
            promise: () => {
                return new Promise((resolve, reject) => {
                    const foundQueue = this.queues.find((queue) => queue.queueURL === params.QueueUrl);

                    if (foundQueue) {
                        resolve({ Messages: [{ Body: foundQueue.queueMessages }] });
                    }

                    reject(new Error(`Queue ${params.QueueUrl} was not found.`));
                });
            }
        };
    }

    /**
     * Mock function required to support XRay capture. The XRay wrapper invokes this function, but doesn't care about the response.
     * @returns {{}}
     */
    public customizeRequests(): any {
        return {};
    }

}

export {SQMockClient};
