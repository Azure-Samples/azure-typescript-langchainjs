# Azure AI Search Vector Store

This guide explains how the application uses Azure AI Search as a vector database for document storage and retrieval.

## Overview

[Azure AI Search](https://learn.microsoft.com/azure/search/) (formerly Azure Cognitive Search) is a cloud search service that provides:
- **Vector search**: Store and query high-dimensional embedding vectors
- **Hybrid search**: Combine keyword and semantic search
- **Semantic ranking**: Improve relevance using AI
- **Scalability**: Handle millions of documents

This application uses Azure AI Search to:
1. Store embeddings of PDF documents (262 documents)
2. Perform similarity search to find relevant documents
3. Provide context for the LangChain RAG (Retrieval Augmented Generation) system

## Vector Search Basics

### What are Embeddings?

Embeddings are numerical representations of text:
- Text is converted to high-dimensional vectors (e.g., 1536 dimensions)
- Similar meanings result in similar vectors
- Enables semantic search (meaning-based, not just keyword matching)

Example:
```
"What are the benefits?" → [0.23, -0.45, 0.67, ..., 0.12]  (1536 numbers)
"Tell me about perks"   → [0.21, -0.43, 0.69, ..., 0.14]  (similar vector)
```

### Vector Similarity Search

When a user asks a question:
1. Question is converted to an embedding vector
2. Azure AI Search finds documents with similar embedding vectors
3. Most relevant documents are returned as context
4. LLM generates answer based on retrieved context

## Index Schema

### Default Schema for Vector Documents

This application uses the **default schema** that LangChain creates for vector documents, which is compatible with Azure AI Search:

**Index fields**:
- **`id`**: Unique document identifier (string, key)
- **`content`**: The text content of the document (string, searchable)
- **`content_vector`**: The embedding vector (Collection of Single, searchable, 1536 dimensions)
- **`metadata`**: JSON metadata about the document (string)

Additional fields from metadata:
- **`source`**: Source file path
- **`loc.pageNumber`**: Page number in source document
- **`pdf.version`**, **`pdf.info`**: PDF metadata

### Index Name

The index is named **`northwind`** (configured via `AZURE_AISEARCH_INDEX_NAME` environment variable).

### Index Configuration

```typescript
const indexName = process.env.AZURE_AISEARCH_INDEX_NAME; // "northwind"
```

The index is automatically created by LangChain when documents are first loaded:

**File**: `packages-v1/langgraph-agent/src/azure/vector_store.ts`
```typescript
const vectorStore = await AzureAISearchVectorStore.fromDocuments(
  chunks,
  embeddingsClient,
  VECTOR_STORE_ADMIN_CONFIG,
);
```

## Loading Documents

### Document Source

The application loads documents from the `packages-v1/langgraph-agent/data/` directory:
- **1 Markdown file**: Company overview
- **12 JSON files**: Structured data examples
- **PDF files** (assumed): Employee handbook, benefits documentation

Total: **262 document chunks** after processing

### Loading Process

The loading process is triggered by:
1. **Automatic**: During `azd up` deployment (via `postdeploy` hook)
2. **Manual**: Running `npm run load_data`

**File**: `packages-v1/langgraph-agent/src/scripts/load_vector_store.ts`
```typescript
async function loadData(embeddingsClient: AzureOpenAIEmbeddings): Promise<void> {
  const indexCreated = process.env.INDEX_CREATED;
  const docCount = process.env.INDEX_DOCUMENT_COUNT;

  if (indexCreated !== "true") {
    console.log(`Loading data into vector store... (Current docs: ${docCount || 0})`);
    const dirPath = path.join(__dirname, NORTHWIND_PDF_DIRECTORY);
    await loadPdfsFromDirectory(embeddingsClient, dirPath);
  } else {
    console.log(`Data already loaded. Index has ${docCount} documents.`);
  }
}
```

### Document Processing Pipeline

1. **Read PDFs**: Load PDF files from data directory
2. **Extract text**: Parse PDF content using `pdf-parse`
3. **Chunk documents**: Split into manageable pieces (typically 1000 tokens with 200 token overlap)
4. **Generate embeddings**: Convert chunks to vectors using Azure OpenAI embeddings
5. **Upload to index**: Store in Azure AI Search with metadata

**File**: `packages-v1/langgraph-agent/src/azure/embeddings.ts`
```typescript
export async function loadPdfsFromDirectory(
  embeddingsClient: AzureOpenAIEmbeddings,
  dirPath: string,
): Promise<void> {
  // Read PDFs from directory
  const loader = new DirectoryLoader(dirPath, {
    ".pdf": (path: string) => new PDFLoader(path),
  });
  
  const documents = await loader.load();
  
  // Split into chunks
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  
  const chunks = await splitter.splitDocuments(documents);
  
  // Load into vector store
  await loadDocsIntoAiSearchVector(embeddingsClient, chunks);
}
```

## Querying the Vector Store

### Similarity Search

When a user asks a question, the application performs similarity search:

**File**: `packages-v1/langgraph-agent/src/azure/vector_store.ts`
```typescript
export async function getDocsFromVectorStore(query: string): Promise<Document[]> {
  const store = getReadOnlyVectorStore();
  return store.similaritySearch(query, QUERY_DOC_COUNT);
}
```

**Parameters**:
- **`query`**: The user's question (text)
- **`QUERY_DOC_COUNT`**: Number of documents to retrieve (default: 3)

**Process**:
1. Convert query to embedding vector
2. Find documents with highest cosine similarity
3. Return top 3 most relevant documents

### Search Configuration

```typescript
const VECTOR_STORE_QUERY_CONFIG = {
  endpoint,
  indexName,
  credentials: CREDENTIAL,
  search: {
    type: AzureAISearchQueryType.Similarity,
  },
};
```

**Search type**: `Similarity` uses vector similarity (cosine distance) to find relevant documents.

Other search types available (not used in this sample):
- **`SimilarityHybrid`**: Combines vector and keyword search
- **`SemanticHybrid`**: Uses semantic ranking for better relevance

## Document Count: 262 Documents

### Why This Matters

The application needs **all 262 documents indexed** before the `/answer` endpoint works effectively:

- **Incomplete index**: May return poor or irrelevant answers
- **Complete index**: Provides comprehensive context for questions

### Checking Index Status

```bash
# Check if indexing is complete
azd env get-values | grep INDEX_

# Expected output:
# INDEX_CREATED=true
# INDEX_DOCUMENT_COUNT=262
```

### Indexing Time

Initial indexing takes approximately **5-10 minutes** depending on:
- PDF file size and count
- Azure OpenAI embedding rate limits
- Network latency

### Preventing Duplicate Indexing

The `postdeploy` hook checks `INDEX_CREATED` to avoid re-indexing:

**File**: `azure.yaml`
```yaml
postdeploy:
  run: |
    INDEX_CREATED=$(azd env get-values | grep INDEX_CREATED | cut -d'=' -f2)
    if [ "$INDEX_CREATED" = "true" ]; then
      echo "Index already created. Skipping data load."
    else
      npm run load_data
      azd env set INDEX_CREATED true
      azd env set INDEX_DOCUMENT_COUNT 262
    fi
```

## Rate Limiting and Retry Logic

Azure OpenAI has rate limits for embedding generation. The application includes retry logic:

**File**: `packages-v1/langgraph-agent/src/azure/vector_store.ts`
```typescript
const MAX_INSERT_RETRIES = 3;

async function loadDocsIntoAiSearchVector(
  embeddingsClient: EmbeddingsInterface,
  chunks: Document<Record<string, any>>[],
): Promise<AzureAISearchVectorStore> {
  let retries = 0;

  while (retries < MAX_INSERT_RETRIES) {
    try {
      return await AzureAISearchVectorStore.fromDocuments(
        chunks,
        embeddingsClient,
        VECTOR_STORE_ADMIN_CONFIG,
      );
    } catch (error: any) {
      if (error.status === 429 && retries < MAX_INSERT_RETRIES - 1) {
        const waitTime = parseInt(error.headers.get("retry-after") || "10") * 1000;
        console.log(`Rate limited. Waiting ${waitTime}ms before retry ${retries + 1}...`);
        await waiter(waitTime);
        retries++;
      } else {
        throw error;
      }
    }
  }
}
```

This handles:
- **429 errors**: Too many requests, wait and retry
- **Retry-After header**: Respect server-suggested wait time
- **Max retries**: Fail after 3 attempts to avoid infinite loops

## Authentication

### Passwordless Authentication

The vector store uses Azure Identity for authentication:

```typescript
import { CREDENTIAL } from "../azure/azure-credential.js";

export const VECTOR_STORE_ADMIN_PASSWORDLESS: AzureAISearchConfig = {
  endpoint,
  indexName,
  credentials: CREDENTIAL,  // Uses DefaultAzureCredential
};
```

### Required Permissions

The managed identity needs these RBAC roles:
- **Search Index Data Contributor**: Create/update index and documents
- **Search Index Data Reader**: Query the index
- **Search Service Contributor**: Manage the service

These are granted in the Bicep template. See [Azure Identity Authentication](./05-azure-identity-authentication.md) for details.

## Vector Store Configuration Comparison

### Admin Configuration (Write Access)

Used for loading documents:
```typescript
const VECTOR_STORE_ADMIN_CONFIG: AzureAISearchConfig = {
  endpoint,
  indexName,
  credentials: CREDENTIAL,
};
```

### Query Configuration (Read Access)

Used for similarity search:
```typescript
const VECTOR_STORE_QUERY_CONFIG: AzureAISearchConfig = {
  endpoint,
  indexName,
  credentials: CREDENTIAL,
  search: {
    type: AzureAISearchQueryType.Similarity,
  },
};
```

Both use the same credentials but have different capabilities based on RBAC roles.

## Monitoring and Management

### View Index in Azure Portal

1. Navigate to Azure Portal
2. Find your Azure AI Search service
3. Go to **Indexes** → **northwind**
4. View:
   - Document count
   - Index size
   - Fields and their types

### Query Index Directly

Using Azure CLI:
```bash
# Get index statistics
az search index show \
  --service-name <search-service-name> \
  --name northwind

# Get document count
az search index show \
  --service-name <search-service-name> \
  --name northwind \
  --query "documentCount"
```

### Delete and Rebuild Index

If you need to reload documents:

```bash
# Delete index
az search index delete \
  --service-name <search-service-name> \
  --name northwind

# Reset environment flags
azd env set INDEX_CREATED false
azd env set INDEX_DOCUMENT_COUNT 0

# Reload data
npm run load_data
```

## Troubleshooting

### No Documents Returned

If queries return no documents:

1. **Check index exists**:
   ```bash
   az search index show --service-name <name> --name northwind
   ```

2. **Check document count**:
   ```bash
   azd env get-values | grep INDEX_DOCUMENT_COUNT
   ```
   Should show 262.

3. **Verify authentication**: Ensure passwordless auth is working

### Poor Search Results

If search results are not relevant:

1. **Check embedding model**: Ensure using same model for indexing and querying
2. **Review query**: Make questions specific and clear
3. **Increase result count**: Try `QUERY_DOC_COUNT = 5` instead of 3
4. **Consider hybrid search**: Use `SimilarityHybrid` search type

### Rate Limit Errors

If you hit rate limits during indexing:

1. **Increase capacity**: Adjust `embeddingDeploymentCapacity` in `infra/main.bicep`
2. **Wait and retry**: The retry logic should handle this automatically
3. **Batch smaller**: Process fewer documents at a time

## Cost Considerations

Azure AI Search pricing depends on:
- **Tier**: Basic, Standard, etc.
- **Replicas**: Number of copies for availability
- **Partitions**: Number of shards for scale
- **Storage**: Amount of data stored

This sample uses:
- **SKU**: Basic (~$75/month)
- **Replicas**: 1 (no high availability)
- **Partitions**: 1 (sufficient for 262 documents)

**Cost optimization**:
- Use Basic tier for development
- Delete index when not needed
- Consider shared environment for multiple applications

## Additional Resources

- [Azure AI Search Documentation](https://learn.microsoft.com/azure/search/)
- [Vector Search in Azure AI Search](https://learn.microsoft.com/azure/search/vector-search-overview)
- [LangChain Azure AI Search Integration](https://js.langchain.com/docs/integrations/vectorstores/azure_aisearch)
- [Azure AI Search Pricing](https://azure.microsoft.com/pricing/details/search/)
- [Index Design Best Practices](https://learn.microsoft.com/azure/search/search-performance-optimization)
