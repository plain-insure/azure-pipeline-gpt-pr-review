import * as tl from "azure-pipelines-task-lib";
import { deleteExistingComments } from "./pr";
import { reviewFile } from "./review";
import { getTargetBranchName } from "./utils";
import { filterFilesByPattern, getChangedFiles } from "./git";
import https from "https";
import { ReviewManager } from "./lib/manager";

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
    const commentLanguage = (tl.getInput("comment_language", false) || "en") as
        | "aa" | "ab" | "ae" | "af" | "ak" | "am" | "an" | "ar" | "as" | "av"
        | "ay" | "az" | "ba" | "be" | "bg" | "bh" | "bi" | "bm" | "bn" | "bo"
        | "br" | "bs" | "ca" | "ce" | "ch" | "co" | "cr" | "cs" | "cu" | "cv"
        | "cy" | "da" | "de" | "dv" | "dz" | "ee" | "el" | "en" | "eo" | "es"
        | "et" | "eu" | "fa" | "ff" | "fi" | "fj" | "fo" | "fr" | "fy" | "ga"
        | "gd" | "gl" | "gn" | "gu" | "gv" | "ha" | "he" | "hi" | "ho" | "hr"
        | "ht" | "hu" | "hy" | "hz" | "ia" | "id" | "ie" | "ig" | "ii" | "ik"
        | "io" | "is" | "it" | "iu" | "ja" | "jv" | "ka" | "kg" | "ki" | "kj"
        | "kk" | "kl" | "km" | "kn" | "ko" | "kr" | "ks" | "ku" | "kv" | "kw"
        | "ky" | "la" | "lb" | "lg" | "li" | "ln" | "lo" | "lt" | "lu" | "lv"
        | "mg" | "mh" | "mi" | "mk" | "ml" | "mn" | "mr" | "ms" | "mt" | "my"
        | "na" | "nb" | "nd" | "ne" | "ng" | "nl" | "nn" | "no" | "nr" | "nv"
        | "ny" | "oc" | "oj" | "om" | "or" | "os" | "pa" | "pi" | "pl" | "ps"
        | "pt" | "qu" | "rm" | "rn" | "ro" | "ru" | "rw" | "sa" | "sc" | "sd"
        | "se" | "sg" | "si" | "sk" | "sl" | "sm" | "sn" | "so" | "sq" | "sr"
        | "ss" | "st" | "su" | "sv" | "sw" | "ta" | "te" | "tg" | "th" | "ti"
        | "tk" | "tl" | "tn" | "to" | "tr" | "ts" | "tt" | "tw" | "ty" | "ug"
        | "uk" | "ur" | "uz" | "ve" | "vi" | "vo" | "wa" | "wo" | "xh" | "yi"
        | "yo" | "za" | "zh" | "zu";
    const filePattern = tl.getInput("file_pattern");
    const aiApiKey = tl.getInput("api_key", false);
    const useManagedIdentity = tl.getBoolInput("use_managed_identity", false);
    const azureSubscription = tl.getInput("azure_subscription", false);
    const modelName = tl.getInput("model_name", false) || "gpt-4o";
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
    let targetBranch = getTargetBranchName();

    if (!aiApiKey && !useManagedIdentity && !azureSubscription) {
      tl.setResult(tl.TaskResult.Failed, "No authentication method provided! Please provide an API key, enable managed identity, or specify an Azure subscription service connection.");
      return;
    } else if (!aoiEndpoint) {
      tl.setResult(tl.TaskResult.Failed, "Only support Azure AI Service.");
      return;
    } else if (!targetBranch) {
      tl.setResult(tl.TaskResult.Failed, "No target branch found!");
      return;
    }

    let filesNames = await getChangedFiles(targetBranch);

    if (filePattern) {
      filesNames = filterFilesByPattern(filesNames, new RegExp(filePattern));
    }

    // It is sequencial, it is intentional.
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
      `Pull Request reviewed. 
    total files: ${filesNames.length}
    total tokens: ${ReviewManager.getTotalUsage()}
    `
    );
  } catch (err: any) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }
}

run();
