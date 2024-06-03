import * as tl from "azure-pipelines-task-lib";
import { deleteExistingComments } from "./pr";
import { reviewFile } from "./review";
import { getTargetBranchName } from "./utils";
import { filterFilesByPattern, getChangedFiles } from "./git";
import https from "https";

async function run() {
  try {
    if (tl.getVariable("Build.Reason") !== "PullRequest") {
      tl.setResult(
        tl.TaskResult.Skipped,
        "This task should be run only when the build is triggered from a Pull Request."
      );
      return;
    }

    // params
    const supportSelfSignedCertificate = tl.getBoolInput(
      "support_self_signed_certificate"
    );
    const commentLanguage = tl.getInput("comment_language", true) as
      | "ko"
      | "en";
    const filePattern = tl.getInput("file_pattern");
    const aiApiKey = tl.getInput("api_key", true);
    const aoiEndpoint = tl.getInput("aoi_endpoint", true);
    const aoiInstruction = tl.getInput("aoi_instruction", true);
    const aoiModelResourceId = tl.getInput(
      "aoi_model_resource_id",
      true
    ) as string;

    const aoiExtensionAis = tl.getInput("aoi_extension_ais") as
      | {
          endpoint: string;
          indexName: string;
          apiKey: string;
        }
      | undefined;

    const httpsAgent = new https.Agent({
      rejectUnauthorized: !supportSelfSignedCertificate,
    });
    let targetBranch = getTargetBranchName();

    if (!aiApiKey) {
      tl.setResult(tl.TaskResult.Failed, "No Api Key provided!");
      return;
    } else if (!aoiEndpoint) {
      tl.setResult(tl.TaskResult.Failed, "Only support Azure AI Service.");
      return;
    } else if (!targetBranch) {
      tl.setResult(tl.TaskResult.Failed, "No target branch found!");
      return;
    }

    let filesNames = await getChangedFiles(targetBranch);
    console.log("=====================================");
    console.log("Changed Files");
    console.log("=====================================");
    console.log(filesNames);
    console.log("=====================================");

    if (filePattern) {
      filesNames = filterFilesByPattern(filesNames, new RegExp(filePattern));
    }
    console.log("=====================================");
    console.log("Filtered Changed Files");
    console.log("=====================================");
    console.log(filesNames);
    console.log("=====================================");

    // It is sequencial, it is intentional.
    await deleteExistingComments(httpsAgent);
    for (const fileName of filesNames) {
      await reviewFile({
        targetBranch,
        fileName,
        httpsAgent,
        aoi: {
          apiKey: aiApiKey,
          aoiEndpoint,
          aoiModelResourceId: aoiModelResourceId,
          commentLanguage: commentLanguage,
          customInstruction: aoiInstruction,
          aiSearchExtension: aoiExtensionAis,
        },
      });
    }

    tl.setResult(tl.TaskResult.Succeeded, "Pull Request reviewed.");
  } catch (err: any) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }
}

run();
