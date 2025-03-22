# Architecture Overview

This document provides an overview of the architecture for the Azure TypeScript LangChain.js project.

## High-Level Architecture

The project is structured as a Next.js application with a React frontend and API routes that interact with Azure OpenAI services through LangChain.js. The application follows a simple client-server model:

```
Client (Next.js React UI) <--> Next.js API Routes <--> Azure OpenAI (via LangChain.js)
```

## Key Components

### 1. Frontend (React)

The frontend is built with Next.js 15 and React 19, providing a responsive user interface for interacting with the chatbot.

Key components:
- `ChatInterface.tsx`: Manages the chat state and user interactions
- `MessageList.tsx`: Displays the chat messages
- `ChatInput.tsx`: Handles user input for the chat

### 2. API Layer (Next.js API Routes)

The API layer is implemented using Next.js API routes, which provide serverless endpoints for the frontend to communicate with.

Key endpoints:
- `/api/chat`: Processes chat messages and generates responses using Azure OpenAI

### 3. Azure Integration

The project integrates with Azure OpenAI services to provide AI capabilities.

Key components:
- `azure-openai.ts`: Manages the connection to Azure OpenAI services
- `chat-chain.ts`: Creates LangChain chains for chat functionality

### 4. LangChain.js Integration

LangChain.js is used to simplify interactions with language models and create more complex workflows.

## Directory Structure

```
/
├── docs/                  # Documentation
├── public/                # Static assets
├── src/
│   ├── app/               # Next.js app directory
│   │   ├── api/           # API routes
│   │   │   └── chat/      # Chat API endpoint
│   │   ├── layout.tsx     # Root layout component
│   │   └── page.tsx       # Home page component
│   ├── components/        # React components
│   ├── lib/               # Utility libraries
│   │   ├── azure/         # Azure-specific utilities
│   │   └── langchain/     # LangChain.js integrations
│   ├── middleware.ts      # Next.js middleware
│   └── types/             # TypeScript type definitions
└── tests/                 # Test files
    ├── e2e/               # End-to-end tests
    ├── integration/       # Integration tests
    └── unit/              # Unit tests
```

## Data Flow

1. User sends a message through the ChatInterface component
2. The message is sent to the `/api/chat` API route
3. The API route uses LangChain.js to format the message and send it to Azure OpenAI
4. Azure OpenAI generates a response, which is returned through the API
5. The response is displayed in the ChatInterface

## Environment Variables

The application uses the following environment variables:

- `AZURE_OPENAI_API_KEY`: API key for Azure OpenAI
- `AZURE_OPENAI_ENDPOINT`: Endpoint URL for Azure OpenAI
- `AZURE_OPENAI_API_DEPLOYMENT_NAME`: Deployment name for the Azure OpenAI model
- `AZURE_OPENAI_API_VERSION`: API version for Azure OpenAI (default: 2023-12-01-preview)

## Security Considerations

- Environment variables are used for sensitive configuration
- API routes validate input using Zod schema validation
- Middleware adds security headers to API responses
