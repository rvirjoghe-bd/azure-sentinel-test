import {BlobData} from "./interfaces";
import {InvocationContext} from "@azure/functions";
import {LogsIngestionClient} from "@azure/monitor-ingestion";
import {TokenCredential} from "@azure/core-auth/dist/browser/tokenCredential";

export class LogManager {
    private client: LogsIngestionClient;
    private readonly dataCollectionRuleId: string;

    constructor(credential: TokenCredential) {
        const dataCollectionEndpoint = process.env.DATA_COLLECTION_ENDPOINT || "";
        if (dataCollectionEndpoint === "") {
            throw new Error('Invalid DCE');
        }

        this.dataCollectionRuleId = process.env.DATA_COLLECTION_RULE_ID || "";
        if (this.dataCollectionRuleId === "") {
            throw new Error('Invalid DCR ID');
        }

        this.client = new LogsIngestionClient(dataCollectionEndpoint, credential, {
            // audience: "https://api.loganalytics.azure.cn/.default", // support other Azure clouds ??
        });
    }

    async write(data: BlobData, context: InvocationContext): Promise<void> {
        for (const streamName in data) {
            try {
                if (!Array.isArray(data[streamName])) {
                    throw new Error(`Not array`);
                }
                if (data[streamName].length === 0) {
                    throw new Error(`Empty`);
                }

                // TODO: split in batches (max 1MB)
                // TODO: is this really necessary or does event push service already do this?
                await this.client.upload(this.dataCollectionRuleId, streamName, data[streamName]);
                context.log(`Successfully sent ${data[streamName].length} records to Log Analytics for table ${streamName}`);
            } catch (error) {
                context.error(`Error sending data to Log Analytics for table ${streamName}:`, error);
            }
        }
    }
}