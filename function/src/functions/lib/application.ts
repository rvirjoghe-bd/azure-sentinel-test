import {BlobItem} from "@azure/storage-blob";
import {InvocationContext} from "@azure/functions";
import {LogManager} from "./logManager";
import {BlobManager} from "./blobManager";
import type {TokenCredential} from "@azure/identity"

export class Application {
    private blobManager: BlobManager;
    private logManager: LogManager;
    private stop: boolean = false;
    private static instance: Application;

    constructor(credential: TokenCredential) {
        this.blobManager = new BlobManager(credential);
        this.logManager = new LogManager(credential);
    }

    static getInstance(credential: TokenCredential): Application {
        if (!Application.instance) {
            Application.instance = new Application(credential);
        }
        return Application.instance;
    }

    async run(context: InvocationContext) {
        setInterval(() => {
            context.log('Time threshold reached');
            this.stop = true;
        }, 8.5 * 60 * 1000);

        try {
            const blobItems = this.blobManager.getBlobs(context);
            for await (const blobItem of blobItems) {
                if (this.stop) {
                    break;
                }
                await this.processBlob(blobItem, context);
            }
        } catch (error) {
            context.log(`Error processing blobs: ${error.message}`);
        }
    }

    private async processBlob(blobItem: BlobItem, context: InvocationContext) {
        try {
            const blobItemManager = this.blobManager.getBlobItemManager(blobItem, context);
            const data = await blobItemManager.getData();

            await this.logManager.write(data, context);

            await blobItemManager.delete();
        } catch (error) {
            context.error(`Could not process blob ${blobItem.name}`, error);
        }
    }
}