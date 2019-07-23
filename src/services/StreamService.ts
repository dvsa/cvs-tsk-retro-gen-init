import {DynamoDBRecord} from "aws-lambda";
import {DynamoDB} from "aws-sdk";

class StreamService {

    /**
     * Extract INSERT events from the DynamoDB Stream, convert them
     * to a JS object
     * @param event
     */
    public static getVisitsStream(event: any) {
        return event.Records.filter((record: DynamoDBRecord) => { // Retrieve "MODIFY" visit events
            return record.eventName === "MODIFY" && record.dynamodb && record.dynamodb.NewImage && record.dynamodb.NewImage.activityType.S === "visit";
        })
        .map((record: DynamoDBRecord) => { // Convert to JS object
            if (record.dynamodb && record.dynamodb.NewImage) {
                return DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);
            }
        });
    }
}

export {StreamService};
