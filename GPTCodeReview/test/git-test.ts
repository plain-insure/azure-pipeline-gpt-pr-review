import fs from "fs";

import { getGitDiff } from "../src/lib/git";

(async () => {
  const results = await getGitDiff({
    gitDir: "...",
    sourceBranch: "....",
    targetBranch: "master",
  });

  let info = {
    diffFiles: 0,
    diffLengths: 0,
  };

  info.diffFiles = results.length;

  for (const result of results) {
    info.diffLengths += result.content.length;
  }

  console.log(results);
  console.log(info);
})();
