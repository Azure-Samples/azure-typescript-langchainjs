# Azure Identity Authentication

This guide explains how this application uses Azure Identity for passwordless authentication with Azure services.

## Overview

This application uses **passwordless authentication** (also called **managed identity** authentication) instead of API keys. This is a security best practice that:
- Eliminates the need to store secrets in code or configuration
- Automatically rotates credentials
- Provides fine-grained access control via RBAC (Role-Based Access Control)
- Works seamlessly in both local development and cloud deployment

## Authentication Flow

### In Azure (Production)

When deployed to Azure Container Apps:
1. Container App uses a **User-Assigned Managed Identity**
2. The managed identity is granted RBAC roles on Azure OpenAI and AI Search
3. The `DefaultAzureCredential` automatically uses the managed identity
4. No secrets or keys are needed

### Local Development

When running locally:
1. Developer authenticates with `az login`
2. The `DefaultAzureCredential` automatically uses the Azure CLI credentials
3. The developer's Azure AD account must have appropriate RBAC roles
4. No secrets or keys are needed

## DefaultAzureCredential

The application uses the `@azure/identity` package's `DefaultAzureCredential`:

**File**: `packages-v1/langgraph-agent/src/azure/azure-credential.ts`
```typescript
import { DefaultAzureCredential } from "@azure/identity";

export const CREDENTIAL = new DefaultAzureCredential();
```

### Credential Chain

`DefaultAzureCredential` tries multiple authentication methods in order:

1. **Environment** - Environment variables (for service principal)
2. **Managed Identity** - For Azure resources (Container Apps, VMs, etc.)
3. **Visual Studio Code** - VS Code Azure extension
4. **Azure CLI** - `az login` credentials
5. **Azure PowerShell** - PowerShell credentials
6. **Interactive Browser** - Falls back to browser login

For this application:
- **Local dev**: Uses Azure CLI credentials (step 4)
- **Azure deployment**: Uses Managed Identity (step 2)

## Using Azure Identity with Azure Clients

### Azure OpenAI

The application uses token-based authentication with Azure OpenAI:

**File**: `packages-v1/langgraph-agent/src/azure/azure-credential.ts`
```typescript
export const SCOPE_OPENAI = "https://cognitiveservices.azure.com/.default";

export async function azureADTokenProvider_OpenAI() {
  const tokenResponse = await CREDENTIAL.getToken(SCOPE_OPENAI);
  return tokenResponse.token;
}
```

**About the token provider**: The `azureADTokenProvider` is specific to third-party SDKs like LangChain that don't natively support Azure SDK authentication patterns. When using official Azure SDKs (like `@azure/search-documents`), you can pass the `DefaultAzureCredential` directly without a token provider. However, LangChain's `@langchain/openai` package requires a token provider function that returns a string token, hence this wrapper.

This token provider is used when initializing Azure OpenAI clients in LangChain:

**File**: `packages-v1/langgraph-agent/src/azure/llm.ts`
```typescript
import { AzureChatOpenAI } from "@langchain/openai";
import { azureADTokenProvider_OpenAI } from "./azure-credential.js";

export function getChatModel(): AzureChatOpenAI {
  return new AzureChatOpenAI({
    azureADTokenProvider: azureADTokenProvider_OpenAI,
    // ... other config
  });
}
```

### Azure AI Search

The vector store uses the credential directly:

**File**: `packages-v1/langgraph-agent/src/azure/vector_store.ts`
```typescript
import { CREDENTIAL } from "../azure/azure-credential.js";

export const VECTOR_STORE_ADMIN_PASSWORDLESS: AzureAISearchConfig = {
  endpoint,
  indexName,
  credentials: CREDENTIAL,
};
```

The application checks the `SET_PASSWORDLESS` environment variable to choose between key-based and passwordless authentication:

```typescript
export const VECTOR_STORE_ADMIN_CONFIG: AzureAISearchConfig =
  process.env.SET_PASSWORDLESS == "true"
    ? VECTOR_STORE_ADMIN_PASSWORDLESS
    : VECTOR_STORE_ADMIN_KEY;
```

## Configuration

### Environment Variables

The application uses `SET_PASSWORDLESS=true` to enable passwordless authentication:

```bash
# In .env file
SET_PASSWORDLESS=true
```

When passwordless is enabled:
- **API keys are NOT required** for OpenAI or AI Search
- **Azure CLI authentication** is used for local development
- **Managed Identity** is used in Azure deployment

When passwordless is disabled (`SET_PASSWORDLESS=false` or not set):
- **API keys are required**:
  - `AZURE_OPENAI_EMBEDDING_KEY`
  - `AZURE_OPENAI_COMPLETE_KEY`
  - `AZURE_AISEARCH_ADMIN_KEY`
  - `AZURE_AISEARCH_QUERY_KEY`

### Azure Deployment

The Bicep template sets `SET_PASSWORDLESS=true` and provides the managed identity client ID:

**File**: `infra/main.bicep`
```bicep
env: [
  {
    name: 'SET_PASSWORDLESS'
    value: 'true'
  }
  {
    name: 'AZURE_CLIENT_ID'
    value: managedIdentity.outputs.clientId
  }
]
```

## Required RBAC Roles

### For Azure OpenAI

The managed identity (or user principal) needs:
- **Cognitive Services OpenAI User** - For making API calls
- **Cognitive Services OpenAI Contributor** - For model management (optional)

These are granted in the Bicep template:

```bicep
roleAssignments: [
  {
    principalId: principalId
    roleDefinitionIdOrName: 'Cognitive Services OpenAI User'
    principalType: principalType
  }
  {
    principalId: managedIdentity.outputs.principalId
    roleDefinitionIdOrName: 'Cognitive Services OpenAI User'
    principalType: 'ServicePrincipal'
  }
]
```

### For Azure AI Search

The managed identity (or user principal) needs:
- **Search Index Data Contributor** - For creating/updating index and documents
- **Search Index Data Reader** - For querying
- **Search Service Contributor** - For managing the service

These are also granted in the Bicep template:

```bicep
roleAssignments: [
  {
    principalId: managedIdentity.outputs.principalId
    roleDefinitionIdOrName: 'Search Index Data Contributor'
    principalType: 'ServicePrincipal'
  }
  {
    principalId: managedIdentity.outputs.principalId
    roleDefinitionIdOrName: 'Search Index Data Reader'
    principalType: 'ServicePrincipal'
  }
]
```

## Local Development Setup

### 1. Authenticate with Azure CLI

```bash
az login
```

This authenticates your user account with Azure.

### 2. Verify Your Identity

```bash
# Show current account
az account show

# Show your user principal ID
az ad signed-in-user show --query id -o tsv
```

### 3. Ensure You Have Required Roles

Your Azure AD user account needs the same roles as the managed identity. These should be automatically assigned during `azd up` via the `principalId` parameter.

If you get permission errors, verify your roles:

```bash
# Check your roles on Azure OpenAI
az role assignment list \
  --assignee $(az ad signed-in-user show --query id -o tsv) \
  --scope /subscriptions/<subscription-id>/resourceGroups/<resource-group>/providers/Microsoft.CognitiveServices/accounts/<openai-name>

# Check your roles on Azure AI Search
az role assignment list \
  --assignee $(az ad signed-in-user show --query id -o tsv) \
  --scope /subscriptions/<subscription-id>/resourceGroups/<resource-group>/providers/Microsoft.Search/searchServices/<search-name>
```

### 4. Configure Environment

Ensure your `.env` file has:

```bash
SET_PASSWORDLESS=true
```

And does NOT require API keys (these can be empty or omitted):
```bash
AZURE_OPENAI_EMBEDDING_KEY=""
AZURE_OPENAI_COMPLETE_KEY=""
AZURE_AISEARCH_ADMIN_KEY=""
AZURE_AISEARCH_QUERY_KEY=""
```

## Troubleshooting

### Authentication Failed Locally

**Error**: `DefaultAzureCredential authentication failed`

**Solution**:
1. Run `az login` to authenticate
2. Verify you're logged in: `az account show`
3. Ensure you have required RBAC roles
4. Try logging out and back in: `az logout && az login`

### Permission Denied

**Error**: `Authorization failed` or `403 Forbidden`

**Solution**:
1. Verify your RBAC role assignments
2. Wait a few minutes for role assignments to propagate
3. Ensure you're using the correct Azure subscription: `az account set --subscription <subscription-id>`

### Wrong Credential Type

**Error**: `The credential in DefaultAzureCredential is expected to be a TokenCredential`

**Solution**:
- Ensure you're using `@azure/identity` version 4.x or later
- Check that `DefaultAzureCredential` is imported correctly
- Verify your `package.json` dependencies

### Managed Identity Not Working in Azure

**Error**: Application can't authenticate when deployed to Azure

**Solution**:
1. Verify the Container App has a managed identity assigned
2. Check RBAC role assignments in Azure Portal
3. Ensure `AZURE_CLIENT_ID` environment variable is set
4. Check Container App logs for detailed error messages

## Security Benefits

Using passwordless authentication provides:

1. **No secrets in code**: Eliminates risk of accidentally committing keys
2. **No secrets in config**: No keys in `.env` files or environment variables
3. **Automatic rotation**: Azure handles credential rotation
4. **Audit trail**: All access is logged via Azure AD
5. **Fine-grained access**: RBAC allows precise permission control
6. **Reduced attack surface**: No keys to steal or leak

## Migration from Key-Based Auth

If you have existing code using API keys:

### Before (Key-based)
```typescript
const client = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_KEY,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
});
```

### After (Passwordless)
```typescript
import { DefaultAzureCredential } from "@azure/identity";

const credential = new DefaultAzureCredential();
const client = new AzureOpenAI({
  azureADTokenProvider: async () => {
    const token = await credential.getToken("https://cognitiveservices.azure.com/.default");
    return token.token;
  },
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
});
```

## Additional Resources

- [Azure Identity SDK Documentation](https://learn.microsoft.com/javascript/api/overview/azure/identity-readme)
- [DefaultAzureCredential Overview](https://learn.microsoft.com/javascript/api/@azure/identity/defaultazurecredential)
- [Managed Identity Overview](https://learn.microsoft.com/azure/active-directory/managed-identities-azure-resources/overview)
- [Azure RBAC Documentation](https://learn.microsoft.com/azure/role-based-access-control/overview)
- [Azure OpenAI Authentication](https://learn.microsoft.com/azure/ai-services/openai/how-to/managed-identity)
- [Azure AI Search Security](https://learn.microsoft.com/azure/search/search-security-overview)
