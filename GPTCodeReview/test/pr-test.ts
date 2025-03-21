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
  .option("outputDir", { type: "string", demandOption: true })
  .parseSync();

const inputRepoDir = argv.repoDir;
const inputSourceBranch = argv.sourceBranch;
const inputTargetBranch = argv.targetBranch;
const inputOaiEndPoint = argv.oaiEndPoint;
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
      aoiEndpoint: inputOaiEndPoint,
      commentLanguage: "en",
      customInstruction: `
      This project is a CPP project.
      https://google.github.io/styleguide/
      Please review with reference to the Google C++ Style Guide at that address.
      "Please correct this line in the pr review"
      `,
    },
    inputGit: git,
  });

  console.log(prReviewResult);
})();

// console.log(changedFiles);
