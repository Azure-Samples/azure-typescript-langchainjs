# Getting Started

This guide will help you get started with the Azure TypeScript LangChain sample, whether you're new to Azure, LangChain, monorepos, or cloud deployment.

## Overview

This repository demonstrates how to build an intelligent agent using TypeScript, LangChain.js, LangGraph, Azure OpenAI, and Azure AI Search to create a Retrieval Augmented Generation (RAG) application. The sample includes an HR document query system that allows users to ask questions about employee benefits and company policies.

## Prerequisites

Before you begin, ensure you have the following:

- **[Node.js](https://nodejs.org/)** (v18 or later)
- **[npm](https://www.npmjs.com/)** (comes with Node.js)
- **[Azure subscription](https://azure.microsoft.com/free/)** - Get a free account if you don't have one
- **[Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli)** - For authentication and resource management
- **[Azure Developer CLI (azd)](https://learn.microsoft.com/azure/developer/azure-developer-cli/install-azd)** - For deployment

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Azure-Samples/azure-typescript-langchainjs.git
cd azure-typescript-langchainjs
```

### 2. Authenticate with Azure

```bash
# Login to Azure CLI
az login

# Configure Azure Developer CLI to use Azure CLI authentication
azd config set auth.useAzCliAuth true
```

### 3. Deploy to Azure

```bash
# Deploy all resources and the application
azd up
```

**Important Notes:**
- Choose a short environment name (7-10 lowercase letters recommended, e.g., `lang-exam`)
- The deployment process takes approximately 15 minutes
- This will:
  - Build the Docker container
  - Create all necessary Azure resources (OpenAI, AI Search, Container Apps, etc.)
  - Load the Azure AI Search index with embeddings from PDF documents
  - Deploy the application

### 4. Wait for Document Indexing

After deployment completes, the system will automatically index PDF documents into Azure AI Search. The sample includes **262 documents** that need to be indexed before you can use the `/answer` endpoint effectively.

You can check the indexing status in the deployment output, or use the Azure Portal to view your Azure AI Search service.

### 5. Test the API

Once indexing is complete, you can test the API:

```bash
# Get the deployed app URL from azd
azd env get-values | grep SERVICE_API_URI

# Test the API
curl -X POST <YOUR_API_URL>/answer \
  -H "Content-Type: application/json" \
  -d '{"question": "What are the standard benefit options?"}'
```

## Next Steps

- [Learn about local development](./02-local-development.md)
- [Understand the CI/CD infrastructure](./03-infrastructure-deployment.md)
- [Learn how to test APIs locally](./04-testing-with-http-files.md)
- [Understand Azure Identity authentication](./05-azure-identity-authentication.md)

## Common Issues

### Deployment Fails

If deployment fails, check:
- Your Azure subscription has sufficient quota for the required resources
- You're deploying to a supported region (eastus2 or swedencentral)
- Your environment name follows naming conventions (3-64 chars, lowercase letters, numbers, hyphens)

### Can't Query Documents

If queries return empty results:
- Ensure all 262 documents are indexed (check `INDEX_DOCUMENT_COUNT` in environment variables)
- Wait a few minutes after deployment for indexing to complete
- Check the Azure AI Search service in the Azure Portal

## Additional Resources

- [LangChain.js Documentation](https://js.langchain.com/)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraphjs/)
- [Azure OpenAI Service Documentation](https://learn.microsoft.com/azure/ai-services/openai/)
- [Azure AI Search Documentation](https://learn.microsoft.com/azure/search/)
- [Azure Container Apps Documentation](https://learn.microsoft.com/azure/container-apps/)
