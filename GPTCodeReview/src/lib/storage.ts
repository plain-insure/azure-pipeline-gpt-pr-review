import fs from "fs";
import { glob } from "glob";
import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";

function readFiles(input: { root: string; pattern: RegExp }) {}

export async function uploadStore(input: {
  storageEndpoint: string;
  globPattern: string[];
  globIgnorePattern?: string[];
}) {
  const credential = new DefaultAzureCredential();
  const blobClient = new BlobServiceClient(input.storageEndpoint, credential);
  const containerClient = blobClient.getContainerClient("repos");

  const filenames = await glob(input.globPattern, {
    ignore: input.globIgnorePattern,
  });

  // console.log(fs.readFileSync(files[0]));

  console.log(filenames);

  for (const filename of filenames) {
    new Promise(async () => {
      const file = fs.readFileSync(filename);
      const uploadname = filename.split("/").slice(3).join("/");
      // console.log(filename);
      const blobName = `iwtk/${uploadname}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      const uploadResponse = await blockBlobClient.upload(
        file,
        file.byteLength
      );
    });
  }

  const client = "";
}
