# Azure TypeScript LangChain Documentation

Welcome to the documentation for the Azure TypeScript LangChain sample. This documentation is designed to help learners who are new to Azure, LangChain, monorepos, or cloud deployment understand and work with this repository.

## Quick Links

- 📚 [Getting Started Guide](./01-getting-started.md) - Start here for quick setup
- 💻 [Local Development](./02-local-development.md) - Learn about the monorepo structure and npm workspaces
- 🏗️ [Infrastructure and Deployment](./03-infrastructure-deployment.md) - Understand Azure Developer CLI, Bicep, and CI/CD
- 🧪 [Testing with HTTP Files](./04-testing-with-http-files.md) - Test APIs locally with .http files
- 🔐 [Azure Identity Authentication](./05-azure-identity-authentication.md) - Passwordless auth with managed identities
- 🚀 [Azure Container Apps](./06-azure-container-apps.md) - Learn about Container Apps ingress and deployment
- 🔍 [Azure AI Search Vector Store](./07-azure-ai-search-vector-store.md) - Understanding vector search and document indexing

## Documentation Overview

### For Beginners

If you're new to this stack, we recommend reading the documentation in order:

1. **[Getting Started](./01-getting-started.md)** - Prerequisites and quick deployment
2. **[Local Development](./02-local-development.md)** - Setting up your development environment
3. **[Testing with HTTP Files](./04-testing-with-http-files.md)** - Testing your changes

### For Understanding Azure

If you want to understand the Azure infrastructure:

1. **[Infrastructure and Deployment](./03-infrastructure-deployment.md)** - Azure Developer CLI and Bicep templates
2. **[Azure Identity Authentication](./05-azure-identity-authentication.md)** - Passwordless authentication
3. **[Azure Container Apps](./06-azure-container-apps.md)** - Container hosting and ingress
4. **[Azure AI Search Vector Store](./07-azure-ai-search-vector-store.md)** - Vector database for RAG

### For Understanding LangChain

For LangChain-specific topics:

1. **[Azure AI Search Vector Store](./07-azure-ai-search-vector-store.md)** - How embeddings and vector search work
2. Review the source code in `packages-v1/langgraph-agent/src/` for LangGraph implementation

## Key Concepts

### Monorepo with npm Workspaces

This repository uses npm workspaces to manage multiple related packages:
- **langgraph-agent**: Core agent logic and LangChain integration
- **server-api**: Fastify REST API server

See [Local Development](./02-local-development.md) for details.

### Azure Developer CLI (azd)

`azd` orchestrates the entire deployment workflow:
- Infrastructure provisioning with Bicep
- Docker containerization
- Deployment to Azure Container Apps
- Post-deployment data loading

See [Infrastructure and Deployment](./03-infrastructure-deployment.md) for details.

### Passwordless Authentication

The application uses Azure Identity (DefaultAzureCredential) for secure, keyless authentication:
- **Local**: Uses Azure CLI credentials
- **Cloud**: Uses Managed Identity

See [Azure Identity Authentication](./05-azure-identity-authentication.md) for details.

### Container Apps Ingress

Azure Container Apps provides managed ingress (HTTPS endpoints) instead of traditional regional endpoints. This simplifies routing, SSL/TLS management, and load balancing.

See [Azure Container Apps](./06-azure-container-apps.md) for details.

### Vector Store Indexing

The application loads **262 documents** into Azure AI Search as embedding vectors. You must wait for indexing to complete before using the `/answer` endpoint.

See [Azure AI Search Vector Store](./07-azure-ai-search-vector-store.md) for details.

## Common Workflows

### Deploy to Azure

```bash
az login
azd config set auth.useAzCliAuth true
azd up
```

See [Getting Started](./01-getting-started.md) for full walkthrough.

### Develop Locally

```bash
npm install
npm run build
npm run dev
```

See [Local Development](./02-local-development.md) for details.

### Test the API

Using .http files in VS Code:
1. Open `packages-v1/server-api/http/q1.http`
2. Click "Send Request"
3. View response

See [Testing with HTTP Files](./04-testing-with-http-files.md) for details.

### Monitor Deployed Application

```bash
# View logs
az containerapp logs show --name <app-name> --resource-group <rg> --follow

# Check index status
azd env get-values | grep INDEX_
```

See [Azure Container Apps](./06-azure-container-apps.md) and [Azure AI Search Vector Store](./07-azure-ai-search-vector-store.md).

## Troubleshooting

### Deployment Issues

- Check environment name is 3-64 characters, lowercase, alphanumeric with hyphens
- Ensure deploying to supported region (eastus2 or swedencentral)
- Verify Azure subscription has sufficient quota

### Authentication Issues

- Run `az login` to authenticate locally
- Verify RBAC roles are assigned (automatic with `azd up`)
- Ensure `SET_PASSWORDLESS=true` in environment

### Empty or Poor Answers

- Wait for all 262 documents to be indexed
- Check `INDEX_DOCUMENT_COUNT` equals 262
- Verify Azure AI Search and OpenAI are accessible
- Review application logs for errors

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Developer                                                   │
│  ├─ azd up (deploys infrastructure + app)                   │
│  ├─ az login (authenticates locally)                        │
│  └─ npm run dev (runs locally)                              │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Azure Container Apps                                        │
│  ├─ Ingress: https://app-xxx.eastus2.azurecontainerapps.io │
│  ├─ Managed Identity                                        │
│  └─ Fastify Server → LangGraph Agent                        │
└─────────────────────────────────────────────────────────────┘
                           │
          ┌────────────────┴──────────────────┐
          ▼                                    ▼
┌─────────────────────────┐      ┌──────────────────────────┐
│  Azure OpenAI           │      │  Azure AI Search         │
│  ├─ GPT-4 (completion) │      │  ├─ Index: northwind     │
│  └─ Embeddings          │      │  └─ 262 vector docs      │
└─────────────────────────┘      └──────────────────────────┘
```

## Additional Resources

### Official Documentation

- [LangChain.js](https://js.langchain.com/)
- [LangGraph](https://langchain-ai.github.io/langgraphjs/)
- [Azure OpenAI](https://learn.microsoft.com/azure/ai-services/openai/)
- [Azure AI Search](https://learn.microsoft.com/azure/search/)
- [Azure Container Apps](https://learn.microsoft.com/azure/container-apps/)
- [Azure Developer CLI](https://learn.microsoft.com/azure/developer/azure-developer-cli/)
- [Bicep](https://learn.microsoft.com/azure/azure-resource-manager/bicep/)

### Tutorials

- [Build a RAG app with LangChain](https://js.langchain.com/docs/tutorials/rag)
- [Azure OpenAI quickstart](https://learn.microsoft.com/azure/ai-services/openai/quickstart)
- [Vector search in Azure AI Search](https://learn.microsoft.com/azure/search/vector-search-overview)

### Community

- [LangChain Discord](https://discord.gg/langchain)
- [Azure Developer Community](https://techcommunity.microsoft.com/t5/azure-developer-community-blog/bg-p/AzureDevCommunityBlog)

## Contributing

See the main [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines on contributing to this repository.

## License

This project is licensed under the ISC License - see the [LICENSE.md](../LICENSE.md) file for details.
