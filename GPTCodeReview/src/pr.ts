import { Agent } from "https";
import fetch from "node-fetch";
import {
  getPullRequestThreadsUrl,
  getPullRequestCommentsUrl,
  getDeleteCommentUrl,
  getAuthorizationHeader,
  getBuildServiceName,
} from "./azure-devops-helpers";
import { AZURE_DEVOPS, MESSAGES } from "./constants";

export async function addCommentToPR(
  fileName: string,
  comment: string,
  httpsAgent: Agent
): Promise<void> {
  const body = {
    comments: [
      {
        parentCommentId: 0,
        content: comment,
        commentType: AZURE_DEVOPS.COMMENT_TYPE.TEXT,
      },
    ],
    status: AZURE_DEVOPS.THREAD_STATUS.ACTIVE,
    threadContext: {
      filePath: fileName,
    },
  };

  const prUrl = getPullRequestThreadsUrl();

  const response = await fetch(prUrl, {
    method: "POST",
    headers: {
      Authorization: getAuthorizationHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    agent: httpsAgent,
  });
  
  if (!response.ok) { 
    const errorText = await response.text();
    console.error(`Failed to add comment: ${errorText}`);
    throw new Error(`Failed to add comment: ${response.status} ${errorText}`);
  }
  console.log(MESSAGES.NEW_COMMENT_ADDED);
}

export async function deleteExistingComments(httpsAgent: Agent): Promise<void> {
  console.log(MESSAGES.DELETING_COMMENTS);

  const threadsUrl = getPullRequestThreadsUrl();
  const threadsResponse = await fetch(threadsUrl, {
    headers: {
      Authorization: getAuthorizationHeader(),
    },
    agent: httpsAgent,
  });

  const threads = (await threadsResponse.json()) as { value: any[] };
  const threadsWithContext = threads.value.filter(
    (thread: any) => thread.threadContext !== null
  );

  const buildServiceName = getBuildServiceName();

  for (const thread of threadsWithContext) {
    const commentsUrl = getPullRequestCommentsUrl(thread.id);
    const commentsResponse = await fetch(commentsUrl, {
      headers: {
        Authorization: getAuthorizationHeader(),
      },
      agent: httpsAgent,
    });

    const comments = (await commentsResponse.json()) as { value: any[] };

    for (const comment of comments.value.filter(
      (comment: any) => comment.author.displayName === buildServiceName
    )) {
      const removeCommentUrl = getDeleteCommentUrl(thread.id, comment.id);

      await fetch(removeCommentUrl, {
        method: "DELETE",
        headers: {
          Authorization: getAuthorizationHeader(),
        },
        agent: httpsAgent,
      });
    }
  }

  console.log(MESSAGES.EXISTING_COMMENTS_DELETED);
}
