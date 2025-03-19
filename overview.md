# GPT Pull Request review Task for Azure Pipelines

The GPT Pull Request Review Task for Azure Pipelines is designed to use the GPT model from OpenAI to review Pull Requests and provide feedback as comments in the Pull Request.

## Setup

Before using this task, ensure that the build service has permissions to contribute to Pull Requests in your repository, and allow the task to access the system token.

### Give permission to the build service agent

![contribute_to_pr](https://github.com/mlarhrouch/azure-pipeline-gpt-pr-review/blob/main/images/contribute_to_pr.png?raw=true)

### Allow Task to access the system token

Depending on the type of pipeline you are using, follow one of the two steps below:

#### Yaml pipelines 

Add a checkout section with persistCredentials set to true.

```yaml
steps:
- checkout: self
  persistCredentials: true
```

#### Classic editors 

Enable the option "Allow scripts to access the OAuth token" in the "Agent job" properties.

![allow_access_token](https://github.com/mlarhrouch/azure-pipeline-gpt-pr-review/blob/main/images/allow_access_token.png?raw=true)

### Azure Open AI service

If you choose to use the Azure Open AI service, you must fill in the endpoint and API key of Azure OpenAI. The format of the endpoint is as follows: https://{XXXXXXXX}.openai.azure.com/openai/deployments/{MODEL_NAME}/chat/completions?api-version={API_VERSION}

### OpenAI Models

In case you don't use Azure Open AI Service, you can choose which model to use, the supported models are "gpt-4", "gpt-3.5-turbo" and "gpt-3.5-turbo-16k". if no model is selected the "gpt-3.5-turbo" is used.

### Using Managed Identity

To use Azure Managed Identity for authentication, you need to enable the `use_managed_identity` option in the task settings. This can be done by setting the `use_managed_identity` input to `true` in your pipeline configuration.

Example:

```yaml
steps:
- task: GPTPullRequestReview@0
  inputs:
    use_managed_identity: true
    # other inputs...
```

## How to use it

### Install the extension

To use the GPT Pull Request Review Task, first install the extension in your Azure DevOps organization. Click on the "Get it free" button and follow the prompts to install it. You may need to authorize the extension to access your Azure DevOps account.

### Add the task to the build pipeline

After installing the extension, add the task to your build pipeline. Go to your build pipeline, click on the "+" icon to add a new task, and search for "Review PullRequest by GPT". Select it and add it to your pipeline.

### Configure the task

Once you have added the task to your pipeline, configure it. In the task configuration, provide your API key for OpenAI API. To create an API key, go to https://platform.openai.com/account/api-keys.

### Review Pull Requests

When the build is triggered from a Pull Request, the task will review it. If there is feedback on the changed code, the task will add comments to the Pull Request. If the build is triggered manually, the task will be skipped.

## Compatible with Linux Build Agents

The tasks can execute on all supported build agent operating systems **including Linux and MacOS**.

## Migration to AzureOpenAI

The GPT Pull Request Review Task now uses `AzureOpenAI` from the `openai` package. This change ensures better integration with Azure services and provides enhanced features for reviewing Pull Requests.

### Changes in Configuration

- The `api_key` input is now required for both OpenAI and Azure OpenAI services.
- The `aoi_endpoint` input must be provided for Azure OpenAI service.
- The `use_managed_identity` input can be set to `true` to use Azure Managed Identity for authentication.

### Example Configuration

```yaml
steps:
- task: GPTPullRequestReview@0
  inputs:
    support_self_signed_certificate: false
    comment_language: 'en'
    file_pattern: ''
    api_key: 'your-api-key'
    aoi_endpoint: 'https://your-endpoint.openai.azure.com'
    aoi_instruction: 'Custom instructions'
    aoi_model_resource_id: 'your-model-resource-id'
    aoi_extension_ais_endpoint: 'https://your-ais-endpoint'
    aoi_extension_ais_indexname: 'your-index-name'
    aoi_extension_ais_apikey: 'your-ais-api-key'
    aoi_token_limit: 1000
    git_patch_limit: 5000
    use_managed_identity: false
```
