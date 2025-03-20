import https from "https";

import { getChangedFiles } from "../src/git";
import { reviewFile } from "../src/review";

import { simpleGit } from "simple-git";
import yargs from "yargs";

const argv = yargs(process.argv.slice(2))
  .option("repoDir", { type: "string", demandOption: true })
  .option("sourceBranch", { type: "string", demandOption: true })
  .option("targetBranch", { type: "string", demandOption: true })
  .option("oaiEndPoint", { type: "string", demandOption: true })
  .option("oaiAPIKey", { type: "string", demandOption: true })
  .option("outputDir", { type: "string", demandOption: true })
  .parseSync();

const inputRepoDir = argv.repoDir;
const inputSourceBranch = argv.sourceBranch;
const inputTargetBranch = argv.targetBranch;
const inputOaiEndPoint = argv.oaiEndPoint;
const inputOaiAPIKey = argv.oaiAPIKey;
const outputDir = argv.outputDir;

(async () => {
  const git = simpleGit({
    baseDir: inputRepoDir,
    binary: "git",
  });

  const changedFiles = await getChangedFiles(inputTargetBranch, git);

  const httpsAgent = new https.Agent({});

  console.log("inputOaiEndPoint", inputOaiEndPoint);

  const prReviewResult = await reviewFile({
    targetBranch: inputTargetBranch,
    fileName: changedFiles[0],
    httpsAgent,
    aoi: {
      aoiModelResourceId: "gpt-4o",
      apiKey: inputOaiAPIKey,
      aoiEndpoint: inputOaiEndPoint,
      commentLanguage: "ko",
      customInstruction: `
      이 프로젝트는 CPP 프로젝트입니다.
      https://google.github.io/styleguide/
      해당 주소의, Google C++ Style Guide를 참고하여 리뷰해주세요.
      `,
    },
    inputGit: git,
  });

  console.log(prReviewResult);
})();

// console.log(changedFiles);
