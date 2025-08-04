const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { ContainerClient } = require("@azure/storage-blob");
const config = require('./config.json');

/**
 * Writes a JSON object to Azure Blob Storage using a SAS URL for the container.
 * @param {string} containerSasUrl - The SAS URL of the blob container.
 * @param {string} blobName - The name of the blob to create or overwrite.
 * @param {object} content - The JSON content to be written to the blob.
 */
async function writeToBlob(containerSasUrl, blobName, content) {
    try {
        // Create a BlockBlobClient using the container SAS URL and blob name
        const containerClient = new ContainerClient(containerSasUrl);
        const blobClient = containerClient.getBlockBlobClient(blobName);

        // Upload the JSON string to the blob storage
        const uploadResponse = await blobClient.upload(content, content.length, {
            blobHTTPHeaders: {
                blobContentType: "application/json", // Set the content type to JSON
            },
        });

        console.log("Blob upload successful:", uploadResponse.requestId);
    } catch (error) {
        console.error("Error writing to blob:", error.message);
    }
}

const containerSasUrl = config.sasUrl;
const blobName = `event_${uuidv4()}.json`; // Name of the blob to create or overwrite
const jsonContent = fs.readFileSync('./data.json', {encoding: "utf-8"});

writeToBlob(containerSasUrl, blobName, jsonContent).then(
    _ => console.error('done'),
    error => console.error(error)
);
