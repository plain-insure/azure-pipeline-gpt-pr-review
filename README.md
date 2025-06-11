# Use OpenAI GPT model to review Pull Requests for Azure Devops
A task for Azure DevOps build pipelines to add GPT as PR reviewer

## Installation


~~Installation can be done using [Visual Studio MarketPlace](https://marketplace.visualstudio.com/items?itemName=mustaphalarhrouch.GPTPullRequestReview).~~

Source code and updates: [github.com/plain-insure/azure-pipeline-gpt-pr-review](https://github.com/plain-insure/azure-pipeline-gpt-pr-review)

## Usage

Add the tasks to your build definition.

## Setup

### Give permission to the build service agent

before use this task, make sure that the build service has permissions to contribute to pull requests in your repository :

![contribute_to_pr](https://github.com/plain-insure/azure-pipeline-gpt-pr-review/blob/main/images/contribute_to_pr.png?raw=true)

### Allow Task to access the system token

#### Yaml pipelines 

Add a checkout section with persistCredentials set to true.

```yaml
steps:
- checkout: self
  persistCredentials: true
```

#### Classic editors 

Enable the option "Allow scripts to access the OAuth token" in the "Agent job" properties :

![allow_access_token](https://github.com/plain-insure/azure-pipeline-gpt-pr-review/blob/main/images/allow_access_token.png?raw=true)


### Azure OpenAI Service


If you choose to use the Azure OpenAI service, you must provide both the endpoint and an authentication method. There are two supported authentication methods:

1. **API Key Authentication**
   - This is the standard method for most hosted agents.
   - You must supply the Azure OpenAI endpoint and a valid API key for your resource.
   - The API key can be stored as a pipeline secret or variable.

2. **Managed Identity Authentication**
   - This is recommended for enhanced security and is only supported on self-hosted agents running in Azure (such as Azure VMs or Azure VM Scale Sets) that have a managed identity assigned.
   - The managed identity must be granted the "Cognitive Services User" role (or a custom role with equivalent permissions) on the Azure OpenAI resource.
   - When using managed identity, you do **not** need to provide an API key. The extension will use the managed identity of the build agent to authenticate securely.
   - **Note:** Managed identity authentication is not available on Microsoft-hosted agents. You must use a self-hosted agent that is provisioned with a managed identity and has network access to the Azure OpenAI resource.

**Summary Table:**

| Authentication Method | Agent Type         | Requirements                                                                                 |
|----------------------|--------------------|---------------------------------------------------------------------------------------------|
| API Key              | Any                | API key for Azure OpenAI resource                                                           |
| Managed Identity     | Self-hosted (Azure)| Agent must have managed identity with access to Azure OpenAI; not supported on hosted agents |

For more information on configuring managed identity, see the [Microsoft Docs: Use managed identity to authenticate to Azure OpenAI](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/managed-identity).

#### Using API Key

Set the endpoint and API key of your Azure OpenAI resource. The endpoint format is:

```
https://{RESOURCE_NAME}.openai.azure.com/openai/deployments/{MODEL_NAME}/chat/completions?api-version={API_VERSION}
```

#### Using Managed Identity

To use Managed Identity, set the `use_managed_identity` option to `true` and ensure your build agent has the correct Azure role assignments to access the Azure OpenAI resource. You do **not** need to provide an API key when using Managed Identity.

Example pipeline variable:

```yaml
- task: GPTCodeReview@0
  inputs:
    use_managed_identity: true
    aoi_endpoint: https://{RESOURCE_NAME}.openai.azure.com/
    aoi_model_resource_id: {MODEL_NAME}
    # other options ...
```

See [Microsoft Docs: Use managed identity to authenticate to Azure OpenAI](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/managed-identity) for more details.

### OpenAI Models

If you do not use Azure OpenAI Service, you can choose which model to use. Supported models are "gpt-4", "gpt-3.5-turbo", and "gpt-3.5-turbo-16k". If no model is selected, "gpt-3.5-turbo" is used by default.

## Contributions

Found and fixed a bug or improved on something? Contributions are welcome! Please target your pull request against the `main` branch or report an issue on [GitHub](https://github.com/plain-insure/azure-pipeline-gpt-pr-review/issues) so someone else can try and implement or fix it.

## License

[MIT](https://raw.githubusercontent.com/plain-insure/azure-pipeline-gpt-pr-review/main/LICENSE)
