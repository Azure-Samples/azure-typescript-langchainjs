# Testing with HTTP Files

This guide explains how to test the `/answer` API endpoint using `.http` files during local development.

## Overview

The repository includes `.http` files in the `packages-v1/server-api/http/` directory for testing the API. These files use a simple HTTP request format that can be executed by:
- **[REST Client extension for VS Code](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)**
- **[IntelliJ HTTP Client](https://www.jetbrains.com/help/idea/http-client-in-product-code-editor.html)**
- Other HTTP client tools

## Available Test Files

The repository includes several pre-configured test files:

```
packages-v1/server-api/http/
├── root.http    # Test root endpoint (health check)
├── q1.http      # Example question 1
├── q2.http      # Example question 2
└── q3.http      # Example question 3
```

## HTTP File Format

HTTP files use a simple text format:

```http
POST http://127.0.0.1:3000/answer HTTP/1.1
content-type: application/json

{
    "question": "What are the standard benefit options?"
}
```

### Format Breakdown:
1. **Request line**: `POST <URL> HTTP/1.1`
2. **Headers**: Key-value pairs (e.g., `content-type: application/json`)
3. **Empty line**: Separates headers from body
4. **Request body**: JSON payload

## Testing Locally with VS Code

### 1. Install REST Client Extension

Install the [REST Client extension](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) in VS Code.

### 2. Start the Development Server

In a terminal:

```bash
# From repository root
npm run dev
```

The server will start on `http://localhost:3000`.

### 3. Execute HTTP Requests

1. Open any `.http` file (e.g., `packages-v1/server-api/http/q1.http`)
2. Click the "Send Request" button that appears above the request
3. View the response in a new tab

### Example Request

**File**: `q1.http`
```http
POST http://127.0.0.1:3000/answer HTTP/1.1
content-type: application/json

{
    "question":"Does the NorthWind Health plus plan cover eye exams?"
}
```

**Response**:
```json
{
  "question": "Does the NorthWind Health plus plan cover eye exams?",
  "answer": "Yes, the NorthWind Health Plus plan includes vision coverage..."
}
```

## Testing the Root Endpoint

**File**: `root.http`
```http
GET http://127.0.0.1:3000/ HTTP/1.1
```

**Response**:
```json
{
  "status": "ok",
  "message": "Hello from LangGraph API!"
}
```

This is useful for:
- Verifying the server is running
- Health checks
- Smoke testing after deployments

## Example Questions

### Question 1: NorthWind Health Plus Benefits

```http
POST http://127.0.0.1:3000/answer HTTP/1.1
content-type: application/json

{
    "question":"Does the NorthWind Health plus plan cover eye exams?"
}
```

### Question 2: Dental Coverage

```http
POST http://127.0.0.1:3000/answer HTTP/1.1
content-type: application/json

{
    "question":"Tell me about dental coverage in the Health Plus plan"
}
```

### Question 3: Vacation Policy

```http
POST http://127.0.0.1:3000/answer HTTP/1.1
content-type: application/json

{
    "question":"What does the employee handbook say about vacation time?"
}
```

## Testing Against Deployed Application

To test the deployed application, update the URL in your `.http` files:

```http
POST https://<your-container-app-url>/answer HTTP/1.1
content-type: application/json

{
    "question":"What are the standard benefit options?"
}
```

Get your deployed URL:
```bash
azd env get-values | grep SERVICE_API_URI
```

## Using curl for Testing

If you prefer command-line testing:

```bash
# Test root endpoint
curl http://localhost:3000/

# Test answer endpoint
curl -X POST http://localhost:3000/answer \
  -H "Content-Type: application/json" \
  -d '{"question": "What are the standard benefit options?"}'
```

For deployed applications:
```bash
# Get your app URL
APP_URL=$(azd env get-values | grep SERVICE_API_URI | cut -d'=' -f2 | tr -d '"')

# Test the deployed app
curl -X POST "$APP_URL/answer" \
  -H "Content-Type: application/json" \
  -d '{"question": "What are the standard benefit options?"}'
```

## Response Structure

All `/answer` endpoint responses follow this structure:

```json
{
  "question": "Original question text",
  "answer": "Generated answer based on retrieved documents"
}
```

## Troubleshooting

### Server Not Responding

If requests fail:

1. **Check server is running**:
   ```bash
   # Should show process on port 3000
   lsof -i :3000
   ```

2. **Check server logs** in the terminal where `npm run dev` is running

3. **Verify environment variables** are configured correctly in `.env`

### Empty or Poor Quality Answers

If answers are empty or low quality:

1. **Check index is populated**:
   ```bash
   azd env get-values | grep INDEX_DOCUMENT_COUNT
   ```
   Should show 263 documents.

2. **Verify Azure AI Search connection**:
   - Check `AZURE_AISEARCH_ENDPOINT` in `.env`
   - Ensure passwordless auth is configured (`SET_PASSWORDLESS=true`)
   - Verify you're logged in with `az login`

3. **Check Azure OpenAI models are deployed**:
   - Verify model names match deployment names in Azure Portal

### 404 Not Found

Ensure you're using the correct endpoint:
- **Correct**: `POST /answer`
- **Incorrect**: `GET /answer` (wrong HTTP method)

### Authentication Errors

If you get authentication errors when testing locally:

```bash
# Re-authenticate with Azure CLI
az login

# Verify credentials work
az account show
```

See [Azure Identity Authentication](./05-azure-identity-authentication.md) for more details.

## Best Practices

1. **Use descriptive questions**: Clear, specific questions get better answers
2. **Test incrementally**: Start with simple questions, then try complex ones
3. **Check server logs**: Monitor console output for errors and performance
4. **Wait for indexing**: Ensure all 263 documents are indexed before testing
5. **Version control**: Don't commit `.http` files with production URLs or sensitive data

## Creating Your Own Test Files

Create new `.http` files for your own test cases:

```http
### Test custom question
POST http://127.0.0.1:3000/answer HTTP/1.1
content-type: application/json

{
    "question":"Your question here"
}

### Test another question (separated by ###)
POST http://127.0.0.1:3000/answer HTTP/1.1
content-type: application/json

{
    "question":"Another question"
}
```

Multiple requests in a single file can be separated by `###` comments.

## Additional Resources

- [REST Client Extension Documentation](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
- [HTTP Request Format (RFC 2616)](https://www.w3.org/Protocols/rfc2616/rfc2616-sec5.html)
- [curl Documentation](https://curl.se/docs/manual.html)
- [Fastify Documentation](https://www.fastify.io/)
