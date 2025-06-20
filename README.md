# Azure DevOps GPT PR Review Extension

An intelligent Azure DevOps build pipeline task that leverages OpenAI GPT models to automatically review pull requests and provide AI-powered feedback on code changes.

## ✨ Features

- 🤖 **AI-Powered Code Review**: Uses OpenAI GPT models to analyze code changes and provide intelligent feedback
- 🔄 **Automated PR Comments**: Automatically adds review comments directly to your pull requests
- 🔐 **Multiple Authentication Methods**: Supports API Key, Managed Identity, and Service Connection authentication
- 🏗️ **Flexible Deployment**: Works with both Microsoft-hosted and self-hosted build agents
- 🎯 **Configurable**: Customizable model selection, comment language, and review instructions

## 📦 Installation

Install the extension from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=plain.AzureOpenAiCopilot).

**Source Code**: [github.com/plain-insure/azure-pipeline-gpt-pr-review](https://github.com/plain-insure/azure-pipeline-gpt-pr-review)

## 🚀 Quick Start

Add the GPT Code Review task to your build pipeline:

```yaml
- task: GPTCodeReview@0
  inputs:
    # Authentication (choose one method)
    api_key: '$(AZURE_OPENAI_API_KEY)'          # Option 1: API Key
    # use_managed_identity: true                # Option 2: Managed Identity  
    # azure_subscription: 'My Azure Connection' # Option 3: Service Connection
    
    # Azure OpenAI Configuration
    aoi_endpoint: 'https://your-resource.openai.azure.com/'
    aoi_model_resource_id: 'gpt-4o'
    
    # Optional: Customize the review
    comment_language: 'en'
    aoi_instruction: 'Focus on code quality, security, and best practices'
```

## ⚙️ Setup Guide

### Step 1: Configure Build Service Permissions

Before using this task, you need to ensure the build service has the necessary permissions to contribute to pull requests in your repository.

#### For All Agent Types (Microsoft-hosted and Self-hosted)

1. **Navigate to Project Settings**:
   - Go to your Azure DevOps project
   - Click on **Project Settings** (gear icon in bottom left)
   - Select **Repositories** under the "Repos" section

2. **Configure Repository Permissions**:
   - Select your repository from the list
   - Go to the **Security** tab
   - Find the build service account in the users/groups list:
     - For project-level build service: `[ProjectName] Build Service ([OrganizationName])`
     - For collection-level build service: `Project Collection Build Service ([OrganizationName])`

3. **Grant Required Permissions**:
   Set the following permissions to **Allow**:
   - **Contribute to pull requests**: `Allow`
   - **Read**: `Allow` 
   - **Contribute**: `Allow` (if not already set)

   ![Contribute to PR Permission](https://github.com/plain-insure/azure-pipeline-gpt-pr-review/blob/main/images/contribute_to_pr.png?raw=true)

#### Additional Considerations by Agent Type

**Microsoft-Hosted Agents**:
- Use the project-level build service account: `[ProjectName] Build Service ([OrganizationName])`
- No additional agent-specific configuration required
- Authentication options: API Key or Service Connection only

**Self-Hosted Agents**:
- May use either project-level or collection-level build service accounts
- If using Managed Identity: Ensure the agent VM has the correct Azure role assignments
- Authentication options: API Key, Service Connection, or Managed Identity

### Step 2: Enable System Token Access

The task needs access to the system token to post comments to pull requests.

#### For YAML Pipelines

Add a checkout step with `persistCredentials: true`:

```yaml
steps:
- checkout: self
  persistCredentials: true

- task: GPTCodeReview@0
  inputs:
    # your configuration...
```

#### For Classic Build Pipelines

1. Edit your build pipeline
2. Go to the **Agent job** properties
3. Under **Additional options**, enable:
   - ✅ **Allow scripts to access the OAuth token**

![Allow Access Token](https://github.com/plain-insure/azure-pipeline-gpt-pr-review/blob/main/images/allow_access_token.png?raw=true)

### Step 3: Configure Azure OpenAI Authentication

This extension supports three authentication methods to access Azure OpenAI services. Choose the method that best fits your security requirements and infrastructure setup.

## 🔐 Authentication Methods

### Method 1: API Key Authentication 🔑

**Best for**: Quick setup, development environments, Microsoft-hosted agents  
**Agent Support**: ✅ Microsoft-hosted, ✅ Self-hosted

API Key authentication is the simplest method and works with any agent type.

#### Setup Steps:

1. **Get your Azure OpenAI API Key**:
   - Navigate to your Azure OpenAI resource in the Azure portal
   - Go to **Keys and Endpoint** section
   - Copy one of the API keys

2. **Store the API Key Securely**:
   - In Azure DevOps, go to **Pipelines** > **Library**
   - Create a new **Variable Group** or edit an existing one
   - Add a variable named `AZURE_OPENAI_API_KEY`
   - Set the value to your API key and mark it as **Secret** 🔒

3. **Configure the Pipeline**:
   ```yaml
   variables:
   - group: 'azure-openai-secrets'  # Reference your variable group
   
   steps:
   - task: GPTCodeReview@0
     inputs:
       api_key: '$(AZURE_OPENAI_API_KEY)'
       aoi_endpoint: 'https://your-resource.openai.azure.com/'
       aoi_model_resource_id: 'gpt-4o'
   ```

#### Endpoint Format:
Your Azure OpenAI endpoint should be in the format:
```
https://{RESOURCE_NAME}.openai.azure.com/
```

**⚠️ Security Note**: Never hardcode API keys in your pipeline YAML. Always use Azure DevOps secret variables.

---

### Method 2: Managed Identity Authentication 🛡️

**Best for**: Enhanced security, self-hosted agents in Azure  
**Agent Support**: ❌ Microsoft-hosted, ✅ Self-hosted (Azure VMs only)

Managed Identity provides the highest security by eliminating the need to store secrets.

#### Prerequisites:
- Self-hosted build agent running on an Azure VM or Azure VM Scale Set
- The VM must have a **System-assigned** or **User-assigned** managed identity

#### Setup Steps:

1. **Enable Managed Identity on Your Build Agent VM**:
   
   **For System-assigned Managed Identity**:
   ```bash
   # Using Azure CLI
   az vm identity assign --resource-group myResourceGroup --name myVM
   ```
   
   **For User-assigned Managed Identity**:
   ```bash
   # Create user-assigned identity
   az identity create --resource-group myResourceGroup --name myUserAssignedIdentity
   
   # Assign to VM
   az vm identity assign --resource-group myResourceGroup --name myVM \
     --identities /subscriptions/mySubscription/resourcegroups/myResourceGroup/providers/Microsoft.ManagedIdentity/userAssignedIdentities/myUserAssignedIdentity
   ```

2. **Grant Azure OpenAI Access**:
   
   Navigate to your Azure OpenAI resource and assign the **Cognitive Services User** role:
   
   ```bash
   # Get the managed identity principal ID
   PRINCIPAL_ID=$(az vm identity show --resource-group myResourceGroup --name myVM --query principalId --output tsv)
   
   # Assign the role
   az role assignment create \
     --assignee $PRINCIPAL_ID \
     --role "Cognitive Services User" \
     --scope "/subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/YOUR_RESOURCE_GROUP/providers/Microsoft.CognitiveServices/accounts/YOUR_OPENAI_RESOURCE"
   ```

3. **Configure the Pipeline**:
   ```yaml
   steps:
   - task: GPTCodeReview@0
     inputs:
       use_managed_identity: true
       aoi_endpoint: 'https://your-resource.openai.azure.com/'
       aoi_model_resource_id: 'gpt-4o'
   ```

#### Troubleshooting Managed Identity:
- Verify the build agent VM has network access to Azure OpenAI
- Check that the managed identity has the correct role assignment
- Ensure the Azure DevOps agent service is running under the correct context to access the managed identity

**Note**: For more information on configuring managed identity, see the [Microsoft Docs: Use managed identity to authenticate to Azure OpenAI](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/managed-identity).

---

### Method 3: Service Connection Authentication 🔗

**Best for**: Enterprise environments, centralized credential management  
**Agent Support**: ✅ Microsoft-hosted, ✅ Self-hosted

Service connections provide a centralized way to manage Azure credentials in Azure DevOps and support both traditional service principals and modern federated identity.

## 🔗 Service Connection Types

### Option A: Service Principal (Client Secret)

**Traditional authentication using client ID and secret.**

#### Setup Steps:

1. **Create a Service Principal**:
   ```bash
   # Create service principal
   az ad sp create-for-rbac --name "azure-openai-service-principal" \
     --role "Cognitive Services User" \
     --scopes "/subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/YOUR_RESOURCE_GROUP/providers/Microsoft.CognitiveServices/accounts/YOUR_OPENAI_RESOURCE"
   ```
   
   Save the output - you'll need the `appId`, `password`, and `tenant`.

2. **Create Service Connection in Azure DevOps**:
   - Go to **Project Settings** > **Service connections**
   - Click **New service connection**
   - Select **Azure Resource Manager**
   - Choose **Service principal (manual)**
   - Fill in the details:
     - **Subscription ID**: Your Azure subscription ID
     - **Subscription Name**: A friendly name
     - **Service Principal ID**: The `appId` from step 1
     - **Service Principal Key**: The `password` from step 1
     - **Tenant ID**: The `tenant` from step 1
   - **Verify** the connection and save

3. **Configure the Pipeline**:
   ```yaml
   steps:
   - task: GPTCodeReview@0
     inputs:
       azure_subscription: 'Your Service Connection Name'
       aoi_endpoint: 'https://your-resource.openai.azure.com/'
       aoi_model_resource_id: 'gpt-4o'
   ```

### Option B: Federated Identity (Workload Identity)

**Modern, more secure authentication without client secrets.**

#### Setup Steps:

1. **Create an App Registration**:
   ```bash
   # Create app registration
   az ad app create --display-name "azure-openai-federated-identity"
   ```

2. **Configure Federated Credentials**:
   
   In the Azure portal:
   - Go to **Azure Active Directory** > **App registrations**
   - Select your app registration
   - Go to **Certificates & secrets** > **Federated credentials**
   - Click **Add credential**
   - Select **Other issuer**
   - Configure:
     - **Issuer**: `https://vstoken.dev.azure.com/YOUR_ORGANIZATION_ID`
     - **Subject identifier**: `sc://YOUR_ORG/YOUR_PROJECT/YOUR_SERVICE_CONNECTION_NAME`
     - **Audience**: `api://AzureADTokenExchange`

3. **Assign Azure OpenAI Access**:
   ```bash
   # Get the app registration object ID
   APP_ID=$(az ad app show --id YOUR_APP_ID --query id --output tsv)
   
   # Create service principal
   az ad sp create --id YOUR_APP_ID
   
   # Assign role
   az role assignment create \
     --assignee YOUR_APP_ID \
     --role "Cognitive Services User" \
     --scope "/subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/YOUR_RESOURCE_GROUP/providers/Microsoft.CognitiveServices/accounts/YOUR_OPENAI_RESOURCE"
   ```

4. **Create Service Connection in Azure DevOps**:
   - Go to **Project Settings** > **Service connections**
   - Click **New service connection**
   - Select **Azure Resource Manager**
   - Choose **Workload Identity federation (automatic)**
   - Select your subscription and resource group
   - **Verify** the connection and save

5. **Configure the Pipeline**:
   ```yaml
   steps:
   - task: GPTCodeReview@0
     inputs:
       azure_subscription: 'Your Federated Service Connection Name'
       aoi_endpoint: 'https://your-resource.openai.azure.com/'
       aoi_model_resource_id: 'gpt-4o'
   ```

## 📊 Authentication Method Comparison

| Authentication Method | Agent Type         | Security Level | Setup Complexity | Secrets Management |
|----------------------|--------------------|--------------|-----------------|--------------------|
| **API Key**          | Any                | ⭐⭐⭐         | ⭐ Easy          | Manual            |
| **Managed Identity** | Self-hosted (Azure)| ⭐⭐⭐⭐⭐       | ⭐⭐⭐ Medium     | None              |
| **Service Principal**| Any                | ⭐⭐⭐⭐        | ⭐⭐ Easy        | Azure DevOps      |
| **Federated Identity**| Any               | ⭐⭐⭐⭐⭐       | ⭐⭐⭐⭐ Complex   | None              |

**Recommendations**:
- **Development/Testing**: API Key
- **Production (Microsoft-hosted)**: Federated Identity Service Connection  
- **Production (Self-hosted in Azure)**: Managed Identity
- **Enterprise/Multi-project**: Service Principal Service Connection

## 🔧 Configuration Options

### Supported Models

The extension supports Azure OpenAI models. Specify your deployed model name in the `aoi_model_resource_id` parameter:

- **GPT-4o**: `gpt-4o` (recommended)
- **GPT-4**: `gpt-4`
- **GPT-4 Turbo**: `gpt-4-turbo`
- **GPT-3.5 Turbo**: `gpt-35-turbo`

### Complete Configuration Example

```yaml
# Example pipeline showing all configuration options
trigger:
- main

pr:
- main

variables:
- group: 'azure-openai-secrets'

pool:
  vmImage: 'ubuntu-latest'

steps:
- checkout: self
  persistCredentials: true

- task: GPTCodeReview@0
  inputs:
    # Authentication (choose one)
    api_key: '$(AZURE_OPENAI_API_KEY)'
    # use_managed_identity: true
    # azure_subscription: 'My Azure Connection'
    
    # Required settings
    aoi_endpoint: 'https://your-resource.openai.azure.com/'
    aoi_model_resource_id: 'gpt-4o'
    
    # Optional customization
    comment_language: 'en'
    aoi_instruction: 'Focus on code quality, security, and best practices. Provide constructive feedback.'
    file_pattern: '.*\.(ts|js|py|cs|java)$'  # Only review specific file types
    aoi_token_limit: '1024'
    git_patch_limit: '10000'
```

## 🚨 Troubleshooting

### Common Issues

#### Authentication Errors

**Problem**: `Service connection not found or not accessible`
- **Solution**: Verify the service connection name matches exactly
- Check that the service connection has been granted access to the pipeline

**Problem**: `API key authentication failed`
- **Solution**: Verify the API key is correct and hasn't expired
- Ensure the variable is marked as secret and properly referenced

**Problem**: `Managed identity authentication failed`
- **Solution**: Verify the VM has managed identity enabled
- Check that the managed identity has the "Cognitive Services User" role
- Ensure the agent service can access the managed identity

#### Permission Errors

**Problem**: `Access denied when posting comments`
- **Solution**: Verify build service permissions (Step 1)
- Check that `persistCredentials: true` is set in checkout step
- Confirm OAuth token access is enabled

**Problem**: `Azure OpenAI access denied`
- **Solution**: Verify the authentication principal has "Cognitive Services User" role
- Check that the Azure OpenAI resource allows the authentication method being used

#### Pipeline Configuration Issues

**Problem**: Task only runs on pull requests
- **Solution**: This is by design. The task only provides value on pull requests
- Use branch policies to require the task on PRs

**Problem**: Comments appear multiple times
- **Solution**: The task automatically deletes previous comments before adding new ones
- If seeing duplicates, check for multiple instances of the task in your pipeline

### Getting Help

If you encounter issues not covered here:

1. Check the [GitHub Issues](https://github.com/plain-insure/azure-pipeline-gpt-pr-review/issues) for known problems
2. Enable debug logging by setting `system.debug: true` in your pipeline variables
3. Review the task logs for detailed error messages

## 🤝 Contributing

Found a bug or want to add a feature? Contributions are welcome! Please target your pull request against the `main` branch or report an issue on [GitHub](https://github.com/plain-insure/azure-pipeline-gpt-pr-review/issues) so someone else can try and implement or fix it.

## 📄 License

[MIT](https://raw.githubusercontent.com/plain-insure/azure-pipeline-gpt-pr-review/main/LICENSE)