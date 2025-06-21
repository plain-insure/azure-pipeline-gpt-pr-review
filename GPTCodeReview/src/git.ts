import { SimpleGitOptions, SimpleGit, simpleGit } from "simple-git";
import * as tl from "azure-pipelines-task-lib";
import binaryExtensions from "binary-extensions";
import { getFileExtension } from "./utils";
import { GIT_CONFIG, SYSTEM_VARIABLES } from "./constants";

const baseDir = (() => {
  let result = "";
  console.log("process.env.NODE_ENV==", process.env.NODE_ENV);

  if (process.env.NODE_ENV !== "test") {
    result = `${tl.getVariable(SYSTEM_VARIABLES.DEFAULT_WORKING_DIRECTORY)}`;
  }
  return result;
})();

const gitOptions: Partial<SimpleGitOptions> = {
  baseDir: baseDir,
  binary: "git",
};

export const git: SimpleGit = simpleGit(gitOptions);

export async function getChangedFiles(
  targetBranch: string,
  inputGit?: SimpleGit
): Promise<string[]> {
  const __git = inputGit || git;
  await __git.addConfig("core.pager", GIT_CONFIG.CORE_PAGER);
  await __git.addConfig("core.quotepath", GIT_CONFIG.CORE_QUOTEPATH);
  await __git.fetch();

  console.log("targetBranch ::= ", targetBranch);

  const diffs = await __git.diff([
    targetBranch,
    "--name-only",
    `--diff-filter=${GIT_CONFIG.DIFF_FILTER}`,
  ]);
  const files = diffs.split("\n").filter((line) => line.trim().length > 0);
  const nonBinaryFiles = files.filter(
    (file) => !binaryExtensions.includes(getFileExtension(file))
  );

  console.log(
    `Changed Files (excluding binary files) : \n ${nonBinaryFiles.join("\n")}`
  );

  console.log(nonBinaryFiles);

  return nonBinaryFiles;
}

export function filterFilesByPattern(
  inputFiles: string[],
  inputPattern?: RegExp
): string[] {
  let result: string[] = [];

  if (inputPattern) {
    result = inputFiles.filter((file) => inputPattern.test(file));
  } else {
    result = inputFiles;
  }

  return result;
}
