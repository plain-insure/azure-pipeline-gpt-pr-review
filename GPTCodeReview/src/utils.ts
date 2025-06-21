import * as tl from "azure-pipelines-task-lib";
import { SYSTEM_VARIABLES } from "./constants";

export function getFileExtension(fileName: string): string {
  return fileName.slice(((fileName.lastIndexOf(".") - 1) >>> 0) + 2);
}

export function getTargetBranchName(): string | undefined {
  let targetBranchName = tl.getVariable(SYSTEM_VARIABLES.PULL_REQUEST_TARGET_BRANCH);

  if (!targetBranchName) {
    targetBranchName = tl
      .getVariable(SYSTEM_VARIABLES.PULL_REQUEST_TARGET_BRANCH_REF)
      ?.replace("refs/heads/", "");
  }

  if (!targetBranchName) {
    return undefined;
  }

  return `origin/${targetBranchName}`;
}
