import { SimpleGitOptions, SimpleGit, simpleGit } from "simple-git";

export async function getGitDiff(input: {
  gitDir: string;
  sourceBranch: string;
  targetBranch: string;
}) {
  const result: any[] = [];

  const git = simpleGit({ baseDir: input.gitDir, binary: "git" });

  let __diff_files = await git.diff([
    input.targetBranch,
    "--name-only",
    "--diff-filter=AMD",
  ]);

  const diff_files = __diff_files.trim().split("\n");

  for (const file of diff_files) {
    const diff = await git.diff([input.targetBranch, "--", file]);
    const diff_output = {
      filename: file,
      content: diff,
    };
    result.push(diff_output);
  }

  return result;
}
