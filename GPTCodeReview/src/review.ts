import { git } from "./git";
import { addCommentToPR } from "./pr";
import { Agent } from "https";
import { chatGPT } from "./lib/openai";
import { ReviewManager } from "./lib/manager";
import { ChatCompletionMessageParam } from "openai/resources";
import { ReviewFileInput } from "./types";
import { REVIEW_PROMPTS, MESSAGES } from "./constants";

export async function reviewFile(input: ReviewFileInput): Promise<void | { fileName: string; review: string; httpsAgent: Agent }> {
  console.log(`Start reviewing ${input.fileName} ...`);
  const __git = input.inputGit || git;
  const patch = await __git.diff([input.targetBranch, "--", input.fileName]);

  const instructions = REVIEW_PROMPTS.en;

  const patchLimit = ReviewManager.reviewOptions?.git?.patchLimit;
  const tokenLimit = ReviewManager.reviewOptions?.aoi?.tokenLimit;

  if (patchLimit && patchLimit < patch.length) {
    await addCommentToPR(
      input.fileName,
      `Skip AI Review, This file over patchLimit: ${patchLimit}`,
      input.httpsAgent
    );
    return;
  }

  if (tokenLimit && tokenLimit < ReviewManager.getTotalUsage()) {
    await addCommentToPR(
      input.fileName,
      `Skip AI Review, This over GPT Token Limit: ${tokenLimit}`,
      input.httpsAgent
    );
    return;
  }

  try {
    let choices: any;
    const resourceId: string = input.aoi.aoiModelResourceId;
    const msg: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: input.aoi.customInstruction || instructions,
      },
      {
        role: "user",
        content: patch,
      },
    ];

    if (input.aoi.commentLanguage && input.aoi.commentLanguage !== "en") {
      msg.push({
        role: "system",
        content: `Translate your answer into ${input.aoi.commentLanguage}. Answer in ${input.aoi.commentLanguage}.`,
      });
    }

    /** Start AI Review */
    const res = await chatGPT({
      endpoint: input.aoi.aoiEndpoint,
      apiKey: input.aoi.apiKey,
      resourceModelId: resourceId,
      modelName: input.aoi.aoiModelName,
      useManagedIdentity: input.aoi.aoiUseManagedIdentity,
      azureSubscription: input.aoi.azureSubscription,
      message: msg,
      options: {
        filename: `${input.fileName}`,
      },
    });

    choices = res.choices;

    if (choices && choices.length > 0) {
      const review = choices[0].message?.content as string;

      console.log("Review File:", input.fileName);
      console.log("====================================");
      console.log("Review Start");
      console.log("====================================");
      console.log(review);
      console.log("====================================");
      console.log("Review End");
      console.log("====================================");

      if (review.trim() !== MESSAGES.NO_FEEDBACK) {
        if (process.env.NODE_ENV === "test") {
          return {
            fileName: input.fileName,
            review,
            httpsAgent: input.httpsAgent,
          };
        } else {
          await addCommentToPR(input.fileName, review, input.httpsAgent);
          return;
        }
      }
    }
    /** END AI Review */

    console.log(`Review of ${input.fileName} completed.`);
  } catch (error: any) {
    if (error.response) {
      console.log(error.response.status);
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }
  }
}
