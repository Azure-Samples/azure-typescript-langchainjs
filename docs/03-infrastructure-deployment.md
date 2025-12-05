# Infrastructure and Deployment

This guide explains the CI/CD infrastructure using Azure Developer CLI (azd), Azure CLI (az), and Bicep templates.

## Overview

This project uses a modern Azure deployment stack:
- **[Azure Developer CLI (azd)](https://learn.microsoft.com/azure/developer/azure-developer-cli/overview)** - Orchestrates the deployment workflow
- **[Azure CLI (az)](https://learn.microsoft.com/cli/azure/)** - Manages Azure resources and authentication
- **[Bicep](https://learn.microsoft.com/azure/azure-resource-manager/bicep/overview)** - Infrastructure as Code (IaC) for Azure resources

## Deployment Architecture

### azure.yaml Configuration

The `azure.yaml` file is the Azure Developer CLI configuration that defines:

```yaml
name: azure-typescript-langchainjs
infra:
  bicep:
    path: ./infra/main.bicep
services:
  api:
    project: ./packages-v1/server-api
    language: ts
    host: containerapp
```

This tells azd how to:
1. Deploy infrastructure using Bicep templates
2. Build and containerize the TypeScript application
3. Deploy to Azure Container Apps

### Deployment Hooks

The `azure.yaml` file includes several hooks that run at different stages:

#### 1. prepackage Hook

Runs **before** the application is packaged/containerized:
- Validates environment name follows Azure naming conventions
- Validates generated resource names (e.g., Container App names)
- Ensures names are 3-64 characters, lowercase, alphanumeric with hyphens
- Prevents deployment failures due to invalid names

#### 2. postprovision Hook

Runs **after** infrastructure is provisioned but before deployment:
- Exports Azure resource information to `.env` file
- Makes configuration available for local development

#### 3. postdeploy Hook

Runs **after** the application is deployed:
- Checks if vector store data needs to be loaded
- Installs npm dependencies
- Builds the application
- Runs `npm run load_data` to load PDF documents into Azure AI Search
- Tracks indexing status with `INDEX_CREATED` and `INDEX_DOCUMENT_COUNT` environment variables
- Prevents duplicate data loading on subsequent deployments

## Azure Resources Created

The Bicep template (`infra/main.bicep`) creates the following Azure resources:

### 1. Resource Group

Groups all related resources for easy management and cleanup.

### 2. Azure Container Registry (ACR)

Stores the Docker container image for the application:
- **SKU**: Basic (sufficient for development)
- **Admin access**: Disabled (uses managed identity)
- **Public access**: Enabled

### 3. Log Analytics Workspace

Collects logs and metrics from Container Apps:
- **SKU**: PerGB2018 (pay-as-you-go)
- **Data retention**: 30 days

### 4. Container Apps Environment

The hosting environment for Container Apps:
- Provides networking isolation
- Integrates with Log Analytics
- Manages shared configuration

### 5. User-Assigned Managed Identity

Provides identity for the container app to access Azure resources:
- Eliminates need for storing secrets
- Granted appropriate RBAC roles on OpenAI and AI Search
- Used for pulling images from ACR

### 6. Azure OpenAI Service

Provides GPT and embedding models:
- **SKU**: S0 (Standard)
- **Deployments**:
  - GPT model: `gpt-4.1-mini` (chat completions)
  - Embedding model: `text-embedding-3-small` (document embeddings)
- **Capacity**: 50 tokens per minute (configurable)
- **Authentication**: Both API key and passwordless (managed identity)

#### Role Assignments:
- Cognitive Services OpenAI User (for user principal)
- Cognitive Services OpenAI Contributor (for user principal)
- Cognitive Services OpenAI User (for container app managed identity)

### 7. Azure AI Search Service

Vector database for document storage and retrieval:
- **SKU**: Basic (supports semantic search)
- **Semantic search**: Standard tier
- **Partition count**: 1
- **Replica count**: 1
- **Index name**: `northwind` (configured in environment variables)
- **Schema**: Uses default schema for vector documents (compatible with LangChain)

#### Role Assignments:
- Search Index Data Contributor (for creating and updating index)
- Search Index Data Reader (for querying)
- Search Service Contributor (for managing service)

### 8. Azure Container App

The running application:
- **Container**: Built from `Dockerfile` in repository root
- **Initial image**: Placeholder (updated during `azd deploy`)
- **Resources**: 0.5 CPU, 1Gi memory
- **Ingress**: External HTTPS with port 3000
- **Scaling**: 1-3 replicas
- **Registry**: Connected to ACR using managed identity

#### Environment Variables:
All configuration is injected as environment variables:
- Azure AI Search endpoint and index name
- Azure OpenAI instance names and model names
- API versions for completions and embeddings
- `SET_PASSWORDLESS=true` for managed identity authentication
- `AZURE_CLIENT_ID` for the managed identity

## Deployment Commands

### Full Deployment

```bash
# Deploy everything (infrastructure + application)
azd up
```

This runs the complete deployment pipeline:
1. Validates configuration
2. Provisions infrastructure (or updates if exists)
3. Builds Docker image
4. Pushes image to ACR
5. Deploys to Container Apps
6. Loads vector data

### Incremental Commands

```bash
# Provision/update infrastructure only
azd provision

# Deploy application code only (infrastructure must exist)
azd deploy

# View environment variables
azd env get-values

# Set environment variable
azd env set KEY value

# Delete all resources
azd down
```

## Bicep Infrastructure as Code

The `infra/main.bicep` file uses Azure Verified Modules (AVM) for best-practice resource configuration:

```bicep
// Example: OpenAI deployment
module openAi 'br/public:avm/res/cognitive-services/account:0.7.1' = {
  params: {
    name: openAiServiceName
    kind: 'OpenAI'
    deployments: [
      {
        name: gptModelName
        model: {
          format: 'OpenAI'
          name: gptModelName
          version: gptModelVersion
        }
      }
    ]
  }
}
```

### Benefits of Bicep:
- **Type safety**: Catch errors at compile time
- **Intellisense**: Editor support for Azure resource properties
- **Modularity**: Reusable modules from Azure Verified Modules
- **Idempotent**: Safe to run multiple times
- **Declarative**: Describe desired state, not steps

## Environment Configuration

### Environment Name

The environment name is used to generate unique resource names:

```bash
# Resource naming pattern
${environmentName}${resourceToken}-{service}

# Example with environmentName="lang-exam"
lang-examxxxxxxxxxxxxx-openai
lang-examxxxxxxxxxxxxx-search
lang-examxxxxxxxxxxxxx-rg
```

**Important**: Keep environment names short (7-10 characters) to avoid exceeding Azure resource name length limits.

### Resource Token

A unique 13-character hash generated from:
- Azure subscription ID
- Environment name
- Azure region

This ensures globally unique resource names.

## Regional Deployment

The application is currently configured to deploy to specific regions with OpenAI model availability:

- **eastus2** (East US 2)
- **swedencentral** (Sweden Central)

These regions support the required GPT and embedding models. See [Azure OpenAI Model Availability](https://learn.microsoft.com/azure/ai-services/openai/concepts/models) for the latest regional information.

## Monitoring and Troubleshooting

### View Application Logs

```bash
# View real-time logs
az containerapp logs show \
  --name <container-app-name> \
  --resource-group <resource-group-name> \
  --follow

# Or use Azure Portal
# Navigate to Container Apps -> Logs
```

### Check Deployment Status

```bash
# View last deployment
azd deploy --help

# Check resource status in Azure Portal
az resource list --resource-group <resource-group-name> -o table
```

### Verify Index Status

```bash
# Check if documents are indexed
azd env get-values | grep INDEX_

# View index in Azure Portal
# Navigate to Azure AI Search -> Indexes -> northwind
```

## Cost Management

The resources created incur costs:
- **Azure OpenAI**: Pay per token (embeddings and completions)
- **Azure AI Search**: Basic tier (~$75/month)
- **Container Apps**: Pay per second of CPU/memory usage
- **Container Registry**: Basic tier (~$5/month)
- **Log Analytics**: Pay per GB ingested

**Tip**: Delete resources when not in use:
```bash
azd down
```

## Additional Resources

- [Azure Developer CLI Documentation](https://learn.microsoft.com/azure/developer/azure-developer-cli/overview)
- [Bicep Documentation](https://learn.microsoft.com/azure/azure-resource-manager/bicep/)
- [Azure Verified Modules](https://azure.github.io/Azure-Verified-Modules/)
- [Azure Container Apps Documentation](https://learn.microsoft.com/azure/container-apps/)
- [Azure Resource Naming Conventions](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/azure-best-practices/resource-naming)
