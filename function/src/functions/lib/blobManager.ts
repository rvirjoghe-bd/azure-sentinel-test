import {
    BlobClient,
    BlobItem, BlobLeaseClient, BlobServiceClient,
    ContainerClient,
} from "@azure/storage-blob";
import {InvocationContext} from "@azure/functions";
import {BlobData} from "./interfaces";
import {TokenCredential} from "@azure/core-auth/dist/browser/tokenCredential";
import {BlobItemManager} from "./blobItemManager";

export class BlobManager {
    private blobServiceClient: BlobServiceClient;
    private containerClient: ContainerClient;

    constructor(credential: TokenCredential) {
        const eventsBlobUrl = process.env.BLOB_URL || "";
        if (eventsBlobUrl === "") {
            throw new Error('Invalid blob url');
        }

        const eventsBlobContainerName = process.env.CONTAINER_NAME || "";
        if (eventsBlobContainerName === "") {
            throw new Error('Invalid container name');
        }

        this.blobServiceClient = new BlobServiceClient(eventsBlobUrl, credential);
        this.containerClient = this.blobServiceClient.getContainerClient(eventsBlobContainerName);
    }

    getBlobs(context: InvocationContext) {
        return this.containerClient.listBlobsFlat({
            includeDeleted: false,
            includeSnapshots: false,
            includeVersions: false,
            includeUncommitedBlobs: false,
            includeTags: false,
        });
    }

    getBlobItemManager(blobItem: BlobItem, context: InvocationContext) {
        return new BlobItemManager(this.containerClient, blobItem, context);
    }
}