import {
    BlobClient,
    BlobItem, BlobLeaseClient,
    ContainerClient,
} from "@azure/storage-blob";
import {InvocationContext} from "@azure/functions";
import {BlobData} from "./interfaces";

export class BlobItemManager {
    private containerClient: ContainerClient;
    private blobClient: BlobClient;
    private blobLeaseClient: BlobLeaseClient;
    private blobItem: BlobItem;
    private context: InvocationContext;
    private leaseId: string | null = null;

    constructor(containerClient: ContainerClient, blobItem: BlobItem, context: InvocationContext) {
        this.context = context;
        this.containerClient = containerClient;
        this.blobClient = this.containerClient.getBlobClient(blobItem.name);
        this.blobLeaseClient = this.blobClient.getBlobLeaseClient();
        this.blobItem = blobItem;
    }

    async getData(): Promise<BlobData> {
        try {
            const leaseResponse = await this.blobLeaseClient.acquireLease(60);
            this.leaseId = leaseResponse.leaseId;

            await this.blobClient.download()
            const downloadResponse = await this.blobClient.download();
            const content = await this.streamToString(downloadResponse.readableStreamBody!);
            const data: BlobData = JSON.parse(content);

            if (data === null) {
                throw new Error(`Invalid data: null`)
            }

            return data;
        } catch (error) {
            this.context.error(`Could not process blob ${this.blobItem.name}`, error);
            return {} as BlobData;
        }
    }

    async delete(): Promise<void> {
        try {
            if (!this.leaseId) {
                return;
            }
            await this.blobClient.deleteIfExists({
                conditions: {
                    leaseId: this.leaseId,
                }
            });
            this.context.log(`Deleted processed blob: ${this.blobItem.name}`);
        } catch (error) {
            this.context.error(`Failed to delete blob: ${this.blobItem.name}`, error)
        }
    }

    private async streamToString(readableStream: NodeJS.ReadableStream): Promise<string> {
        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            readableStream.on("data", (data) => chunks.push(Buffer.from(data)));
            readableStream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
            readableStream.on("error", reject);
        });
    }
}