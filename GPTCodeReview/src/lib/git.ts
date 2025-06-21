import { SimpleGit, simpleGit } from "simple-git";
import { GIT_CONFIG } from "../constants";

interface GitDiffInput {
  gitDir: string;
  sourceBranch: string;
  targetBranch: string;
}

interface GitDiffOutput {
  filename: string;
  content: string;
}

export async function getGitDiff(input: GitDiffInput): Promise<GitDiffOutput[]> {
  const result: GitDiffOutput[] = [];

  const git: SimpleGit = simpleGit({ baseDir: input.gitDir, binary: "git" });

  const diffFiles = await git.diff([
    input.targetBranch,
    "--name-only",
    `--diff-filter=${GIT_CONFIG.DIFF_FILTER}`,
  ]);

  const fileList = diffFiles.trim().split("\n").filter(file => file.trim().length > 0);

  for (const file of fileList) {
    const diff = await git.diff([input.targetBranch, "--", file]);
    const diffOutput: GitDiffOutput = {
      filename: file,
      content: diff,
    };
    result.push(diffOutput);
  }

  return result;
}
