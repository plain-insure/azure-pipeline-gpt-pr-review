import fetch from "node-fetch";
import { git } from "./git";
import { OpenAI } from "openai";
import { addCommentToPR } from "./pr";
import { Agent } from "https";
import * as tl from "azure-pipelines-task-lib";
import { SimpleGit } from "simple-git";
import { chatGPT } from "./lib/openai";
import { ChatRequestMessageUnion } from "@azure/openai";

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
  ko: `코드 리뷰어로서 Pull Request 코드를 리뷰하고, 가능한 버그 및 깨끗한 코드 문제에 대한 피드백을 제공하십시오.
  당신은 패치 형식으로 Pull Request 변경 사항을 제공받습니다.
  각 패치 항목에는 커밋 메시지가 Subject 라인에 있고 코드 변경 사항 (diffs)이 unidiff 형식으로 이어집니다.
  모든 것을 설명할 필요는 없습니다.

  한국어로 답변하세요.

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
    // Optional Params
    aiSearchExtension?: {
      endpoint: string;
      indexName: string;
      apiKey: string;
    };
    commentLanguage?: "en" | "ko";
    customInstruction?: string;
  };
  inputGit?: SimpleGit;
}) {
  console.log(`Start reviewing ${input.fileName} ...`);
  const __git = input.inputGit || git;

  const patch = await __git.diff([input.targetBranch, "--", input.fileName]);

  let instructions = prompts["en"];

  instructions += `${input.aoi.customInstruction}`;

  try {
    let choices: any;
    const resourceId: string = input.aoi.aoiModelResourceId!;
    const msg: ChatRequestMessageUnion[] = [
      {
        role: "system",
        content: instructions,
      },
      {
        role: "system",
        content: input.aoi.customInstruction,
      },
      {
        role: "user",
        content: patch,
      },
    ];

    const res = await chatGPT({
      endpoint: input.aoi.aoiEndpoint,
      resourceModelId: resourceId,
      apiKey: input.aoi.apiKey,
      msg: msg,
    });

    choices = res.choices;

    if (input.aoi.commentLanguage == "ko") {
      const msg = [
        {
          role: "system",
          content:
            "사용자로부터 입력이 들어오면, 해당 입력을 한국어로 번역 해 주세요.",
        },
        {
          role: "user",
          content: choices[0].message?.content,
        },
      ];

      const res = await chatGPT({
        endpoint: input.aoi.aoiEndpoint,
        resourceModelId: resourceId,
        apiKey: input.aoi.apiKey,
        msg: msg,
      });

      choices = res.choices;
    }

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
        }
      }
    }

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
