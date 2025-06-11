import { git } from "./git";
import { addCommentToPR } from "./pr";
import { Agent } from "https";
import { SimpleGit } from "simple-git";
import { chatGPT } from "./lib/openai";
import { ReviewManager } from "./lib/manager";
import { ChatCompletionMessageParam } from "openai/resources";

const prompts = {
  en: `
  Act as a code reviewer of a Pull Request, providing feedback on possible bugs and clean code issues.
  You are provided with the Pull Request changes in a patch format.
  Each patch entry has the commit message in the Subject line followed by the code changes (diffs) in a unidiff format.
  Don't need to describe enverything.

  As a code reviewer, your task is:
          - Review only added, edited or deleted lines.
          - If there's no bugs and the changes are correct, write only 'No feedback.'
          - If there's bug or uncorrect code changes, don't write 'No feedback.'
  `,
};

export async function reviewFile(input: {
  targetBranch: string;
  fileName: string;
  httpsAgent: Agent;
  aoi: {
    apiKey: string;
    aoiEndpoint: string;
    aoiModelResourceId: string;
    aoiModelName?: string;
    aoiUseManagedIdentity?: boolean;
    // Optional Params
    aiSearchExtension?: {
      endpoint: string;
      indexName: string;
      apiKey: string;
    };
    commentLanguage?: "aa" | "ab" | "ae" | "af" | "ak" | "am" | "an" | "ar" | "as" | "av"
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
    customInstruction?: string;
  };
  inputGit?: SimpleGit;
}) {
  console.log(`Start reviewing ${input.fileName} ...`);
  const __git = input.inputGit || git;
  const patch = await __git.diff([input.targetBranch, "--", input.fileName]);

  let instructions = prompts["en"];

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
    const resourceId: string = input.aoi.aoiModelResourceId!;
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

    if (input.aoi.commentLanguage && input.aoi.commentLanguage != "en") {
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

      if (review.trim() !== "No feedback.") {
        if (process.env.NODE_ENV == "test") {
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
