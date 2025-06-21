import fs from "fs";
import { glob } from "glob";
import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";

interface UploadStoreInput {
  storageEndpoint: string;
  globPattern: string[];
  globIgnorePattern?: string[];
}

export async function uploadStore(input: UploadStoreInput): Promise<void> {
  const credential = new DefaultAzureCredential();
  const blobClient = new BlobServiceClient(input.storageEndpoint, credential);
  const containerClient = blobClient.getContainerClient("repos");

  const globOptions = input.globIgnorePattern ? { ignore: input.globIgnorePattern } : {};
  const filenames = await glob(input.globPattern, globOptions);

  console.log(`Found ${filenames.length} files to upload:`, filenames);

  const uploadPromises = filenames.map(async (filename) => {
    try {
      const file = fs.readFileSync(filename);
      const uploadname = filename.split("/").slice(3).join("/");
      const blobName = `iwtk/${uploadname}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      const uploadResponse = await blockBlobClient.upload(
        file,
        file.byteLength
      );
      
      console.log(`Uploaded ${filename} to ${blobName}`);
      return uploadResponse;
    } catch (error) {
      console.error(`Failed to upload ${filename}:`, error);
      throw error;
    }
  });

  await Promise.all(uploadPromises);
  console.log(`Successfully uploaded ${filenames.length} files`);
}
