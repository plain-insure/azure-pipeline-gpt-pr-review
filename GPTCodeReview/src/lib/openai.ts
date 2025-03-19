import {
  AzureOpenAI,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
  ChatCompletion,
  ChatMessage,
  AzureChatExtensionConfigurationUnion,
  AzureClientOptions,
} from "openai";
import { ReviewManager } from "./manager";
import { DefaultAzureCredential } from "@azure/identity";

interface GPTInput {
  resourceModelId: string;
  msg: ChatMessage[];
  apiKey: string;
  useManagedIdentity?: boolean;
  endpoint: string;

  options?: {
    filename?: string;
  };

  aiSearchExtension?: {
    endpoint: string;
    indexName: string;
    apiKey: string;
  };
}

export async function chatGPT(input: GPTInput) {
  let result;

  const useManagedIdentity = input.useManagedIdentity || false;

  const openai = useManagedIdentity
    ? new AzureOpenAI(input.endpoint, new DefaultAzureCredential())
    : new AzureOpenAI(input.endpoint, { apiKey: input.apiKey } as AzureClientOptions);

  const chatOptions: ChatCompletionCreateParamsNonStreaming = {
    maxTokens: 1024,
  };

  if (input.aiSearchExtension) {
    chatOptions["azureExtensionOptions"] = {
      extensions: [
        {
          type: "azure_search",
          topNDocuments: 20,
          strictness: 3,
          endpoint: input.aiSearchExtension.endpoint,
          indexName: input.aiSearchExtension.indexName,
          authentication: useManagedIdentity ? {
            type: "aad",
          } : {
            type: "api_key",
            key: input.aiSearchExtension.apiKey,
          },
        },
      ],
    };
  }

  result = await openai.createChatCompletion(
    input.resourceModelId,
    chatOptions
  );

  if (input.options?.filename) {
    ReviewManager.info.usages.push({
      filename: input.options.filename,
      usages: result.usage,
    });
  } else {
    ReviewManager.info.usages.push({
      filename: "<<Undefined Filename>>",
      usages: result.usage,
    });
  }

  return result;
}
