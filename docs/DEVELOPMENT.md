# Development Guide

This guide covers how to set up your development environment and contribute to the Azure TypeScript LangChain.js project.

## Prerequisites

- Node.js 18.x or later
- npm 8.x or later
- Access to Azure OpenAI services

## Setting Up Your Development Environment

1. Clone the repository:
   ```bash
   git clone https://github.com/Azure-Samples/azure-typescript-langchainjs.git
   cd azure-typescript-langchainjs
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the values with your Azure OpenAI credentials

## Development Workflow

### Starting the Development Server

```bash
npm run dev
```

This starts the Next.js development server on http://localhost:3000.

### Building for Production

```bash
npm run build
```

This creates an optimized production build of the application.

### Running Tests

Run all tests:
```bash
npm test
```

Run unit and integration tests in watch mode:
```bash
npm run test:watch
```

Run end-to-end tests:
```bash
npm run test:e2e
```

### Linting and Formatting

Lint the code:
```bash
npm run lint
```

Format the code with Prettier:
```bash
npx prettier --write .
```

## Project Structure Overview

- `/src`: Source code for the application
  - `/app`: Next.js app router components and pages
  - `/components`: React components
  - `/lib`: Utility functions and services
  - `/types`: TypeScript type definitions
- `/tests`: Test files
  - `/unit`: Unit tests
  - `/integration`: Integration tests
  - `/e2e`: End-to-end tests
- `/docs`: Documentation
- `/public`: Static assets

## Working with Azure OpenAI

### Configuration

The application uses environment variables for configuration. Make sure to set up your Azure OpenAI credentials in the `.env` file:

```
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_DEPLOYMENT_NAME=your-deployment-name
AZURE_OPENAI_API_VERSION=2023-12-01-preview
```

### Testing without Azure OpenAI

For local development without Azure OpenAI credentials, you can implement mock API responses in your tests as shown in the test examples.

## Working with LangChain.js

The project uses LangChain.js to interact with Azure OpenAI. Key files:

- `src/lib/azure/azure-openai.ts`: Sets up the Azure OpenAI connection
- `src/lib/langchain/chat-chain.ts`: Creates LangChain chains for chat functionality

## Troubleshooting

### Common Issues

1. **Authentication Failures**: Ensure your Azure OpenAI credentials are correct in the `.env` file.

2. **API Version Issues**: If you encounter errors related to the API version, check that your Azure OpenAI API version is compatible with the code.

3. **Missing Environment Variables**: Ensure all required environment variables are properly set.

### Getting Help

If you encounter any issues not covered here, please:

1. Check the existing issues in the repository
2. Open a new issue if your problem hasn't been reported yet
