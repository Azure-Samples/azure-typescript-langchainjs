# Azure Container Apps Deployment

This guide explains how the application is deployed to Azure Container Apps and how it uses ingress configuration instead of regional endpoints.

## Overview

[Azure Container Apps](https://learn.microsoft.com/azure/container-apps/overview) is a serverless container hosting platform that:
- Automatically scales based on HTTP traffic, events, or CPU/memory usage
- Provides built-in load balancing and traffic management
- Integrates with Azure Container Registry for private image hosting
- Offers managed TLS certificates for HTTPS endpoints
- Simplifies microservices deployment with service discovery

## Why Container Apps?

For this LangChain application, Container Apps provides:

1. **Easy deployment**: `azd deploy` handles containerization and deployment
2. **Automatic scaling**: Scales from 1-3 replicas based on demand
3. **Managed identity**: Secure authentication to Azure services
4. **Ingress management**: Public HTTPS endpoint without manual DNS/certificate setup
5. **Cost-effective**: Pay only for actual usage (scales to zero capable)

## Application Architecture

```
Internet
   ↓
[Container Apps Ingress]  ← HTTPS://your-app.region.azurecontainerapps.io
   ↓
[Container App: api]
   ├─ Fastify Server (Port 3000)
   ├─ LangGraph Agent
   └─ Managed Identity
        ↓
   [Azure OpenAI]  [Azure AI Search]
```

## Container App Configuration

The Bicep template configures the Container App:

**File**: `infra/main.bicep`
```bicep
module containerApp 'br/public:avm/res/app/container-app:0.11.0' = {
  params: {
    name: 'app-${resourceToken}'
    environmentResourceId: containerAppsEnvironment.outputs.resourceId
    
    containers: [
      {
        name: 'api'
        image: 'mcr.microsoft.com/...'  // Updated by azd deploy
        resources: {
          cpu: json('0.5')
          memory: '1Gi'
        }
        env: [
          // Environment variables for Azure services
        ]
      }
    ]
    
    // Ingress configuration
    ingressTargetPort: 3000
    ingressExternal: true
    ingressTransport: 'http'
    
    // Scaling configuration
    scaleMinReplicas: 1
    scaleMaxReplicas: 3
  }
}
```

## Ingress Configuration

### Container Apps Ingress vs Regional Endpoints

Traditional Azure deployments often use regional endpoints like:
```
https://<service-name>.eastus2.azurewebsites.net
```

**Container Apps uses ingress names** instead:
```
https://<app-name>.<unique-id>.<region>.azurecontainerapps.io
```

### Benefits of Container Apps Ingress

1. **Simplified routing**: Single ingress point for your application
2. **Automatic HTTPS**: Managed TLS certificates
3. **Built-in load balancing**: Distributes traffic across replicas
4. **Traffic splitting**: Support for blue-green deployments (not used in this sample)
5. **Custom domains**: Easy to add custom domain names

### Ingress Configuration Details

```bicep
ingressTargetPort: 3000        // Application listens on port 3000
ingressExternal: true          // Publicly accessible
ingressTransport: 'http'       // Internal traffic uses HTTP (TLS at ingress)
```

**Key Points:**
- **External ingress**: Makes the API publicly accessible from the internet
- **Port 3000**: Matches the Fastify server configuration
- **HTTP transport**: Container Apps terminates TLS at the ingress, uses HTTP internally

### Finding Your Ingress URL

After deployment:

```bash
# Get the full ingress URL
azd env get-values | grep SERVICE_API_URI

# Or use Azure CLI
az containerapp show \
  --name <app-name> \
  --resource-group <resource-group> \
  --query properties.configuration.ingress.fqdn \
  -o tsv
```

Example output:
```
https://app-xxxxxxxxxxxxx.happystone-a1b2c3d4.eastus2.azurecontainerapps.io
```

## Container Configuration

### Resource Limits

```bicep
resources: {
  cpu: json('0.5')    // 0.5 CPU cores
  memory: '1Gi'       // 1 GB RAM
}
```

These limits:
- **Control costs**: Pay for what you allocate
- **Ensure stability**: Prevent resource exhaustion
- **Enable scaling**: Each replica gets these resources

For this application:
- **0.5 CPU** is sufficient for typical RAG queries
- **1 GB RAM** handles LangChain processing and vector operations

### Scaling Configuration

```bicep
scaleMinReplicas: 1
scaleMaxReplicas: 3
```

**Scaling behavior**:
- **Min 1 replica**: Always at least one instance running
- **Max 3 replicas**: Scales up to 3 instances under load
- **Automatic**: Container Apps manages scaling based on HTTP requests

**Note**: The free tier and basic Container Apps Environment support manual scaling. For automatic scaling based on metrics, use a Consumption plan.

## Managed Identity Integration

The Container App uses a **User-Assigned Managed Identity** to access Azure resources:

```bicep
managedIdentities: {
  userAssignedResourceIds: [managedIdentity.outputs.resourceId]
}
```

This identity:
- Authenticates to Azure OpenAI for embeddings and completions
- Authenticates to Azure AI Search for vector operations
- Pulls container images from Azure Container Registry
- Eliminates need for connection strings or API keys

### Environment Variables

Configuration is injected via environment variables:

```bicep
env: [
  { name: 'AZURE_AISEARCH_ENDPOINT', value: aiSearch.outputs.endpoint }
  { name: 'AZURE_AISEARCH_INDEX_NAME', value: 'northwind' }
  { name: 'AZURE_OPENAI_API_INSTANCE_NAME', value: openAi.outputs.name }
  { name: 'SET_PASSWORDLESS', value: 'true' }
  { name: 'AZURE_CLIENT_ID', value: managedIdentity.outputs.clientId }
]
```

These variables tell the application:
- Where to find Azure services
- Which models to use
- To use passwordless authentication

## Deployment Process

### Build and Deploy

When you run `azd deploy`:

1. **Build Docker image** using `Dockerfile` in repository root
2. **Tag image** with unique identifier
3. **Push to Azure Container Registry** using managed identity
4. **Update Container App** with new image reference
5. **Restart replicas** with updated configuration

### Dockerfile

The application uses a multi-stage Dockerfile for optimal image size:

**File**: `Dockerfile`
```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages-v1 ./packages-v1
COPY package*.json ./
CMD ["npm", "start"]
```

Benefits:
- **Smaller image**: Only production dependencies
- **Security**: No build tools in final image
- **Fast startup**: Pre-compiled JavaScript

## Monitoring and Logs

### View Real-Time Logs

```bash
# Using Azure CLI
az containerapp logs show \
  --name <app-name> \
  --resource-group <resource-group> \
  --follow

# Or stream logs
az containerapp logs tail \
  --name <app-name> \
  --resource-group <resource-group>
```

### Log Analytics Integration

Container Apps automatically sends logs to Log Analytics:

```bash
# Query logs using Kusto Query Language (KQL)
az monitor log-analytics query \
  --workspace <workspace-id> \
  --analytics-query "ContainerAppConsoleLogs_CL | where TimeGenerated > ago(1h)" \
  -o table
```

Common queries:
```kql
// All application logs from last hour
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(1h)
| project TimeGenerated, Log_s

// Error logs
ContainerAppConsoleLogs_CL
| where Log_s contains "error"
| project TimeGenerated, Log_s

// Request count by status code
ContainerAppConsoleLogs_CL
| where Log_s contains "POST /answer"
| summarize count() by bin(TimeGenerated, 5m)
```

## Networking

### Public Access

The Container App is configured with external ingress, making it publicly accessible. This is appropriate for:
- Demo applications
- Public APIs
- Development/testing

For production, consider:
- **Internal ingress**: Only accessible within Azure Virtual Network
- **API Management**: Add authentication, rate limiting, caching
- **Application Gateway**: Advanced traffic management and WAF

### Security Considerations

Current configuration:
- ✅ **HTTPS enforced**: All traffic uses TLS
- ✅ **Managed identity**: No secrets in environment
- ✅ **RBAC**: Fine-grained access control
- ⚠️ **Public endpoint**: No authentication required for `/answer`

For production, add:
- Authentication (Azure AD, API keys, JWT)
- Rate limiting
- Input validation and sanitization
- WAF (Web Application Firewall)

## Troubleshooting

### Application Won't Start

Check logs for startup errors:
```bash
az containerapp logs show --name <app-name> --resource-group <rg> --follow
```

Common issues:
- Missing environment variables
- Incorrect port (should be 3000)
- Managed identity permission issues

### Can't Access Ingress URL

1. **Verify ingress is external**:
   ```bash
   az containerapp show --name <app-name> --resource-group <rg> \
     --query properties.configuration.ingress.external
   ```
   Should return `true`.

2. **Check ingress FQDN**:
   ```bash
   az containerapp show --name <app-name> --resource-group <rg> \
     --query properties.configuration.ingress.fqdn
   ```

3. **Verify app is running**:
   ```bash
   az containerapp replica list --name <app-name> --resource-group <rg>
   ```

### Slow Performance

If responses are slow:
1. **Check replica count**: May need more replicas
2. **Review resource limits**: May need more CPU/memory
3. **Check Azure service latency**: OpenAI or AI Search may be slow
4. **Review logs**: Look for bottlenecks or errors

## Cost Optimization

Container Apps pricing is based on:
- **vCPU seconds**: Time × CPU allocation × replicas
- **Memory GB-seconds**: Time × memory allocation × replicas
- **HTTP requests**: Number of requests processed

**Tips to reduce costs**:
1. **Scale to zero**: Set `scaleMinReplicas: 0` for dev/test (adds cold start latency)
2. **Right-size resources**: Use smallest CPU/memory that meets performance needs
3. **Delete when not in use**: `azd down` to remove all resources
4. **Use consumption plan**: More cost-effective for variable workloads

## Additional Resources

- [Azure Container Apps Documentation](https://learn.microsoft.com/azure/container-apps/)
- [Container Apps Ingress Overview](https://learn.microsoft.com/azure/container-apps/ingress-overview)
- [Container Apps Scaling](https://learn.microsoft.com/azure/container-apps/scale-app)
- [Managed Identity in Container Apps](https://learn.microsoft.com/azure/container-apps/managed-identity)
- [Monitor Container Apps](https://learn.microsoft.com/azure/container-apps/observability)
- [Container Apps Best Practices](https://learn.microsoft.com/azure/container-apps/best-practices)
