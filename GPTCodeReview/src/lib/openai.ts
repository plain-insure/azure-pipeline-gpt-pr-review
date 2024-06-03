import {
  OpenAIClient,
  AzureKeyCredential,
  ChatRequestMessageUnion,
  AzureSearchChatExtensionConfiguration,
  AzureChatExtensionConfigurationUnion,
} from "@azure/openai";

interface GPTInput {
  resourceModelId: string;
  msg: ChatRequestMessageUnion[];
  apiKey: string;
  endpoint: string;

  aiSearchExtension?: {
    endpoint: string;
    indexName: string;
    apiKey: string;
  };
}

export async function chatGPT(input: GPTInput) {
  const openai = new OpenAIClient(
    input.endpoint,
    new AzureKeyCredential(input.apiKey)
  );

  const extensions: AzureChatExtensionConfigurationUnion[] = [];
  if (input.aiSearchExtension)
    extensions.push({
      type: "azure_search",
      topNDocuments: 20,
      strictness: 5,
      endpoint: input.aiSearchExtension.endpoint,
      indexName: input.aiSearchExtension.indexName,
      authentication: { type: "api_key", key: input.aiSearchExtension.apiKey },
    });

  const result = await openai.getChatCompletions(
    input.resourceModelId,
    input.msg,
    {
      maxTokens: 1024,
      azureExtensionOptions: {
        extensions: extensions,
      },
    }
  );

  return result;
}

async function chat1() {
  const prompt = {
    en: [
      {
        role: "system",
        content:
          "You are acting as a reviewer. You have to check reviewers answer. If there are something wrong, then fix reviewers answer.",
      },
    ],
    ko: [
      {
        role: "system",
        content: `You are acting as a code reviewer. You are the only one who can see the entire code. You should provide insights to others about the entire code.`,
      },
    ],
  };
}

async function chat2() {
  const prompt = {
    en: [
      {
        role: "system",
        content:
          "Review git diff changes. you must have include code. applying diff minimization techniques if needed.",
      },
    ],
    ko: [
      {
        role: "system",
        content: `
        You are acting as a code reviewer. 
        Please correct any errors in the code. 
        If there are any aspects that can improve readability and enhance the program, please make those improvements as well.
        You have to review the code changed and provide feedback to the author.
        Answer every feedback in 128 tokens.
        Only answer code feedback.
        `,
      },
    ],
  };
}

async function chat3() {}

export async function reviewDefaultChain(input: {
  msg: string;
  chat1: GPTInput;
  chat2: GPTInput;
  chat3: GPTInput;
}) {
  const chat1Result = "";
  const chat2Result = "";
  const chat3Result = "";
}

export async function reviewExpansiveChain() {}
