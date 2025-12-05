# Azure TypeScript LangChainJS Sample

This sample demonstrates how to build an intelligent agent using TypeScript, [LangChain.js](https://js.langchain.com/), [LangGraph](https://github.com/langchain-ai/langgraphjs), Azure OpenAI, and Azure AI Search to create a Retrieval Augmented Generation (RAG) application.

The sample includes an HR document query system that allows users to ask questions about employee benefits and company policies, with the agent retrieving relevant information from PDF documents.

![Agent Workflow](./packages-v1/langgraph-agent/media/agent-workflow.png)

## Features

- TypeScript-based LangChain.js implementation
- LangGraph agent architecture for dynamic orchestration of AI components
- Integration with Azure OpenAI for embeddings and completions
- Vector search with Azure AI Search
- FastAPI server for RESTful API access
- Docker support for containerized deployment
- Environment variable management
- PDF document processing and vector storage

## Repository Structure

The repository is organized as a monorepo with the following packages:

- **langgraph-agent**: Core agent implementation using LangGraph
- **server-api**: FastAPI server exposing the agent functionality

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/)
- [Azure subscription](https://azure.microsoft.com/free/)
- Azure OpenAI service instance with deployed models
- Azure AI Search service instance

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Azure-Samples/azure-typescript-langchainjs.git
cd azure-typescript-langchainjs
```

### 2. Set up Azure resources

Create the following resources:

* Azure AI Search
* Azure OpenAI
    * LLM model for chat completion
    * Embedding model to get embeddings for PDF files
* Azure Container Apps
* Azure Container registry

Use Azure CLI for authentication and let Azure Developer CLI know that. 

```bash
az login
azd config set auth.useAzCliAuth true
```

Begin deployment

```bash
azd up
```

For the environment name, keep it short such as 7 lowercase letters: `lang-exam`.

Process takes up to 15 minutes:
- Build Dockerfile
- Create resources
- Load Azure AI Search index with embeddings

## API Usage

The API server exposes the following endpoints:

- `POST /answer`: Submit a question to the agent

Example request:

```bash
curl -X POST http://localhost:3000/answer \
  -H "Content-Type: application/json" \
  -d '{"question": "What are the standard benefit options?"}' 
```

## Example Questions

The agent can answer questions about the HR documents, such as:

1. "What are the standard benefit options?"
2. "Tell me about dental coverage in the Health Plus plan"
3. "What does the employee handbook say about vacation time?"

## License

This project is licensed under the ISC License - see the [LICENSE.md](LICENSE.md) file for details.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.
