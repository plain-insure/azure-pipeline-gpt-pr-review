import { ReviewManager } from "./manager";
import { AzureOpenAI } from "openai";
import { ChatCompletionMessageParam, ChatCompletionCreateParamsNonStreaming } from "openai/resources";
import { DefaultAzureCredential, getBearerTokenProvider, ClientSecretCredential, WorkloadIdentityCredential, TokenCredential } from "@azure/identity";
import * as tl from "azure-pipelines-task-lib";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import fetch from "node-fetch";


interface GPTInput {
  resourceModelId: string;
  message: ChatCompletionMessageParam[];
  endpoint: string;
  apiKey?: string;
  modelName?: string;
  useManagedIdentity?: boolean;
  azureSubscription?: string;

  options?: {
    filename?: string;
  };

  aiSearchExtension?: {
    endpoint: string;
    indexName: string;
    apiKey: string;
  };
}


async function generateToken(serviceConnectionID: string): Promise<string> {
  const url = process.env["SYSTEM_OIDCREQUESTURI"] + "?api-version=7.1&serviceConnectionId=" + serviceConnectionID;
  var oidcToken = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + tl.getEndpointAuthorizationParameter('SystemVssConnection', 'AccessToken', false)
    }
  }).then(async response => {
    var oidcObject = await (response?.json()) as { oidcToken: string };

    if (!oidcObject?.oidcToken) {
      throw new Error(tl.loc("Error_FederatedTokenAquisitionFailed"));
    }
    return oidcObject.oidcToken;
  });

  tl.setSecret(oidcToken);
  return oidcToken;
}


export async function chatGPT(input: GPTInput) {
  let result;

  const deployment = "gpt-4o";
  const apiVersion = "2025-01-01-preview";
  const endpoint = input.endpoint;
  const scope = "https://cognitiveservices.azure.com/.default";

  const apiKey = input.apiKey;

  const useManagedIdentity = input.useManagedIdentity || false;
  const azureSubscription = input.azureSubscription;

  const options: {
    apiKey?: string;
    azureADTokenProvider?: ReturnType<typeof getBearerTokenProvider>;
    deployment: string;
    apiVersion: string;
    endpoint: string;
  } = {
    deployment,
    apiVersion,
    endpoint,
  };


  if (useManagedIdentity) {
    // Use Managed Identity authentication
    const credential = new DefaultAzureCredential();
    options.azureADTokenProvider = getBearerTokenProvider(credential, scope);
  } else if (azureSubscription) {
    // Use Service Connection authentication
    console.log(`Using Azure Subscription: ${azureSubscription}`);
    const auth = tl.getEndpointAuthorization(azureSubscription, true);
    let scheme = 'workloadidentityfederation'
    if (!auth) {
      console.log(`Service connection "${azureSubscription}" not found or not accessible.`);
    } else {
      scheme = auth.scheme.toLowerCase()
    }
    console.log(`Auth scheme: ${scheme}`);


    interface WorkloadIdentityFederationCredentials {
      servicePrincipalId: string | undefined;
      oidcToken: string;
    }

    let credential: TokenCredential;
    if (scheme === 'serviceprincipal') {
      const clientId = tl.getEndpointAuthorizationParameter(azureSubscription, 'serviceprincipalid', false);
      const clientSecret = tl.getEndpointAuthorizationParameter(azureSubscription, 'serviceprincipalkey', false);
      const tenantId = tl.getEndpointAuthorizationParameter(azureSubscription, 'tenantid', false);

      if (!clientId || !clientSecret || !tenantId) {
        throw new Error('Service connection is missing required service principal credentials.');
      }
      credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
    } else if (scheme === 'workloadidentityfederation') {
      const clientId = tl.getEndpointAuthorizationParameter(azureSubscription, "serviceprincipalid", true);

      const tenantId = tl.getEndpointAuthorizationParameter(azureSubscription, 'tenantid', false);
      let tokenFile = tl.getEndpointAuthorizationParameter(azureSubscription, 'federatedTokenFile', true);
      if (!tokenFile) {
        const oidcToken = await generateToken(azureSubscription);
        // Write the token to a temporary file
        const tmpDir = os.tmpdir();
        const tokenFilePath = path.join(tmpDir, `oidc-token-${Date.now()}.txt`);
        fs.writeFileSync(tokenFilePath, oidcToken, { encoding: "utf8" });

        // Set tokenFile to the path
        tokenFile = tokenFilePath;
        tl.setSecret(oidcToken);
      }

      if (!clientId || !tokenFile || !tenantId) {
        throw new Error('Service connection is missing required workload identity federation credentials.');
      }
      process.env.AZURE_CLIENT_ID = clientId;
      process.env.AZURE_TENANT_ID = tenantId;
      process.env.AZURE_FEDERATED_TOKEN_FILE = tokenFile;

      credential = new WorkloadIdentityCredential({
        tenantId,
        clientId,
        tokenFilePath: tokenFile,
      });
    } else {
      throw new Error(`Unsupported authentication scheme: ${scheme}`);
    }

    options.azureADTokenProvider = getBearerTokenProvider(credential, scope);
  } else {
    // Use API Key authentication
    options.apiKey = apiKey;
  }

  const client = new AzureOpenAI(options);

  const chatOptions: ChatCompletionCreateParamsNonStreaming = {
    max_tokens: 1024,
    model: input.modelName || "gpt-4o",
    messages: input.message
  };

  if (input.aiSearchExtension) {
    data_sources: [{
      type: "azure_search",
      parameters: {
        topNDocuments: 20,
        strictness: 3,
        endpoint: input.aiSearchExtension.endpoint,
        indexName: input.aiSearchExtension.indexName,
        authentication: useManagedIdentity ? {
          type: "aad",
        } : {
          type: "api_key",
          key: input.aiSearchExtension.apiKey,
        }
      }
    }]
  };


  result = await client.chat.completions.create(chatOptions);




  const usageData = result.usage
    ? {
      completionTokens: result.usage.completion_tokens,
      promptTokens: result.usage.prompt_tokens,
      totalTokens: result.usage.total_tokens,
    }
    : undefined;

  ReviewManager.info.usages.push({
    filename: input.options?.filename || "<<Undefined Filename>>",
    usages: usageData,
  });


  return result;
}