# Local Development

This guide explains how to set up and develop this application locally using the monorepo structure with npm workspaces.

## Monorepo Structure

This repository is organized as a **monorepo** using [npm workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces). A monorepo allows multiple related packages to be managed in a single repository, making it easier to share code and maintain consistency.

### Package Structure

The repository contains two main workspaces in the `packages-v1` directory:

```
azure-typescript-langchainjs/
├── packages-v1/
│   ├── langgraph-agent/     # Core agent implementation
│   └── server-api/           # Fastify API server
├── package.json              # Root package with workspace config
└── azure.yaml                # Azure deployment configuration
```

#### langgraph-agent

The core agent implementation package containing:
- **LangGraph agent architecture** for orchestrating AI components
- **Azure OpenAI integration** for embeddings and completions
- **Azure AI Search vector store** integration
- **PDF document processing** and loading scripts
- **Reusable utilities** for Azure credential management

#### server-api

The API server package that:
- Exposes the agent functionality via REST API
- Uses [Fastify](https://www.fastify.io/) web framework
- Depends on the `langgraph-agent` package
- Handles HTTP requests to the `/answer` endpoint

### Separation of Concerns

Each workspace has a clear responsibility:
- **langgraph-agent**: Business logic, AI orchestration, data processing
- **server-api**: HTTP layer, request/response handling, API contracts

This separation makes it easy to:
- Test agent logic independently
- Reuse the agent in different contexts (CLI, API, batch processing)
- Scale different components independently

## Setting Up Local Development

### 1. Install Dependencies

From the repository root:

```bash
# Install all dependencies for all workspaces
npm install
```

This will install dependencies for both the root project and all workspace packages.

### 2. Configure Environment Variables

**Prerequisites**: Complete the `azd up` deployment first (see [Getting Started](./01-getting-started.md)), which automatically creates the `.env` file with all necessary Azure resource information.

If you need to manually update environment variables, edit the `.env` file in the repository root:

```bash
# Azure OpenAI
AZURE_OPENAI_EMBEDDING_INSTANCE="your-openai-instance"
AZURE_OPENAI_EMBEDDING_MODEL="text-embedding-3-small"
AZURE_OPENAI_EMBEDDING_API_VERSION="2023-05-15"

AZURE_OPENAI_COMPLETE_INSTANCE="your-openai-instance"
AZURE_OPENAI_COMPLETE_MODEL="gpt-4.1-mini"
AZURE_OPENAI_COMPLETE_API_VERSION="2025-01-01-preview"
AZURE_OPENAI_COMPLETE_MAX_TOKENS=1000

# Azure AI Search
AZURE_AISEARCH_ENDPOINT="https://your-search-service.search.windows.net"
AZURE_AISEARCH_INDEX_NAME="northwind"

# Authentication (use passwordless for local dev)
SET_PASSWORDLESS=true
```

**Note**: For local development, use passwordless authentication (`SET_PASSWORDLESS=true`) with Azure CLI login. See [Azure Identity Authentication](./05-azure-identity-authentication.md) for details.

### 3. Build All Packages

```bash
# Build all workspaces
npm run build
```

This command:
1. Builds all workspace packages using their individual `build` scripts
2. Links packages together (via `postbuild` script)
3. Creates compiled JavaScript in each package's `dist/` directory

## Key npm Scripts

The root `package.json` defines several useful scripts that work across all workspaces:

### Building

```bash
# Build all packages
npm run build

# Build specific workspace
npm run build --workspace=packages-v1/langgraph-agent
```

### Running the Server

```bash
# Run the server in development mode (builds and runs with hot reload)
npm run dev

# Or run production mode after building
npm run build
npm start
```

The API server will start on `http://localhost:3000`.

### Working with Vector Data

**Note**: If you deployed with `azd up`, vector data is already loaded. These commands are only needed if you're setting up from scratch without using `azd up`.

```bash
# Load PDF documents into Azure AI Search index (only needed if not using azd up)
npm run load_data

# Test embedding generation (useful for verifying Azure OpenAI authentication)
npm run embed

# Test LLM completion (useful for verifying Azure OpenAI authentication)
npm run llm
```

### Docker

```bash
# Build Docker image
npm run build:docker

# Build and run in Docker
npm run start:docker
```

### Cleanup

```bash
# Clean build artifacts from all packages
npm run clean
```

## Development Workflow

### 1. Make Changes to Agent Logic

Edit files in `packages-v1/langgraph-agent/src/`:

```bash
# Make changes to agent code
vim packages-v1/langgraph-agent/src/graph.ts

# Rebuild the package
npm run build --workspace=packages-v1/langgraph-agent
```

### 2. Make Changes to API Server

Edit files in `packages-v1/server-api/src/`:

```bash
# Make changes to server code
vim packages-v1/server-api/src/server.ts

# Rebuild and run
npm run dev --workspace=packages-v1/server-api
```

### 3. Test Your Changes

See [Testing with HTTP Files](./04-testing-with-http-files.md) for details on testing the API.

## Workspace-Specific Commands

You can run commands in specific workspaces:

```bash
# Run a command in langgraph-agent
npm run <script> --workspace=packages-v1/langgraph-agent

# Run a command in server-api
npm run <script> --workspace=packages-v1/server-api
```

## TypeScript Configuration

Each package has its own `tsconfig.json` for TypeScript compilation:

- **langgraph-agent**: Configured for ES modules with Node18 target
- **server-api**: Similar configuration, references langgraph-agent types

## Troubleshooting

### Build Errors

If you encounter build errors:

```bash
# Clean and rebuild everything
npm run clean
npm install
npm run build
```

### Module Not Found Errors

If the server can't find the agent package:

```bash
# Re-link packages
npm run build
```

The `postbuild` script handles linking, but you may need to run it manually.

### Environment Variable Issues

Ensure you're running commands from the repository root where the `.env` file is located. The npm scripts use `--env-file` to load environment variables.

## Additional Resources

- [npm Workspaces Documentation](https://docs.npmjs.com/cli/v7/using-npm/workspaces)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Node.js ES Modules](https://nodejs.org/api/esm.html)
- [Fastify Documentation](https://www.fastify.io/)
