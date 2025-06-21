import * as tl from "azure-pipelines-task-lib";
import { deleteExistingComments } from "./pr";
import { reviewFile } from "./review";
import { getTargetBranchName } from "./utils";
import { filterFilesByPattern, getChangedFiles } from "./git";
import https from "https";
import { ReviewManager } from "./lib/manager";
import { SupportedLanguage } from "./types";
import { AZURE_OPENAI, SYSTEM_VARIABLES, MESSAGES } from "./constants";

async function run(): Promise<void> {
  try {
    if (tl.getVariable(SYSTEM_VARIABLES.BUILD_REASON) !== "PullRequest") {
      tl.setResult(
        tl.TaskResult.Skipped,
        MESSAGES.PULL_REQUEST_ONLY
      );
      return;
    }

    // Parameters
    const supportSelfSignedCertificate = tl.getBoolInput(
      "support_self_signed_certificate"
    );
    const commentLanguage = (tl.getInput("comment_language", false) || "en") as SupportedLanguage;
    const filePattern = tl.getInput("file_pattern");
    const aiApiKey = tl.getInput("api_key", false);
    const useManagedIdentity = tl.getBoolInput("use_managed_identity", false);
    const azureSubscription = tl.getInput("azure_subscription", false);
    const modelName = tl.getInput("model_name", false) || AZURE_OPENAI.DEFAULT_MODEL;
    const aoiEndpoint = tl.getInput("aoi_endpoint", true);
    const aoiInstruction = tl.getInput("aoi_instruction", false);
    const aoiModelResourceId = tl.getInput(
      "aoi_model_resource_id",
      true
    ) as string;
    const aoiTokenLimit = tl.getInput("aoi_token_limit", false);
    const gitPatchLimit = tl.getInput("git_patch_limit", false);

    if (aoiTokenLimit) {
      ReviewManager.reviewOptions.aoi.tokenLimit = parseInt(aoiTokenLimit);
    }
    if (gitPatchLimit) {
      ReviewManager.reviewOptions.git.patchLimit = parseInt(gitPatchLimit);
    }

    const httpsAgent = new https.Agent({
      rejectUnauthorized: !supportSelfSignedCertificate,
    });
    const targetBranch = getTargetBranchName();

    if (!aiApiKey && !useManagedIdentity && !azureSubscription) {
      tl.setResult(tl.TaskResult.Failed, MESSAGES.NO_AUTH_METHOD);
      return;
    } else if (!aoiEndpoint) {
      tl.setResult(tl.TaskResult.Failed, MESSAGES.AZURE_AI_ONLY);
      return;
    } else if (!targetBranch) {
      tl.setResult(tl.TaskResult.Failed, MESSAGES.NO_TARGET_BRANCH);
      return;
    }

    let filesNames = await getChangedFiles(targetBranch);

    if (filePattern) {
      filesNames = filterFilesByPattern(filesNames, new RegExp(filePattern));
    }

    // Sequential processing is intentional
    await deleteExistingComments(httpsAgent);
    for (const fileName of filesNames) {
      await reviewFile({
        targetBranch,
        fileName,
        httpsAgent,
        aoi: {
          apiKey: aiApiKey,
          aoiUseManagedIdentity: useManagedIdentity,
          azureSubscription: azureSubscription,
          aoiEndpoint,
          aoiModelName: modelName,
          aoiModelResourceId: aoiModelResourceId,
          commentLanguage: commentLanguage,
          customInstruction: aoiInstruction,
        },
      });
    }

    tl.setResult(
      tl.TaskResult.Succeeded,
      `${MESSAGES.REVIEW_COMPLETED} 
    total files: ${filesNames.length}
    total tokens: ${ReviewManager.getTotalUsage()}
    `
    );
  } catch (err: any) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }
}

run();
