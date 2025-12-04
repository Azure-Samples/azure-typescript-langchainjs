targetScope = 'subscription'

@minLength(1)
@maxLength(64)
@description('Name of the the environment which is used to generate a short unique hash used in all resources.')
param environmentName string

@minLength(1)
@description('Location for the OpenAI resource')
// https://learn.microsoft.com/azure/ai-services/openai/concepts/models?tabs=python-secure%2Cglobal-standard%2Cstandard-chat-completions#models-by-deployment-type
@allowed([
  'eastus2'
  'swedencentral'
])
@metadata({
  azd: {
    type: 'location'
  }
})
param location string


@description('Name of the GPT model to deploy')
param gptModelName string = 'gpt-4.1-mini'

@description('Version of the GPT model to deploy')
param gptModelVersion string = '2025-04-14'
param gptApiVersion string = '2025-01-01-preview'

@description('Capacity of the GPT deployment')
param gptDeploymentCapacity int = 50

// Embedding model parameters
@description('Name of the embedding model to deploy')
param embeddingModelName string = 'text-embedding-3-small'

@description('Version of the embedding model to deploy')
param embeddingModelVersion string = '1'
param embeddingApiVersion string = '2023-05-15'

@description('Capacity of the embedding model deployment')
param embeddingDeploymentCapacity int = 50

var principalType = 'User'
@description('Id of the user or app to assign application roles')
param principalId string = ''

var resourceToken = toLower(uniqueString(subscription().id, environmentName, location))
var prefix = '${environmentName}${resourceToken}'
var tags = { 'azd-env-name': environmentName }

// Organize resources in a resource group
resource resourceGroup 'Microsoft.Resources/resourceGroups@2021-04-01' = {
    name: '${prefix}-rg'
    location: location
    tags: tags
}

// Azure Container Registry for storing container images
module containerRegistry 'br/public:avm/res/container-registry/registry:0.5.1' = {
  name: 'acr'
  scope: resourceGroup
  params: {
    name: replace('${prefix}acr', '-', '') // ACR names cannot contain hyphens
    location: location
    tags: tags
    acrSku: 'Basic'
    acrAdminUserEnabled: false // Use managed identity instead
    publicNetworkAccess: 'Enabled'
  }
}

// Log Analytics Workspace for Container Apps
module logAnalytics 'br/public:avm/res/operational-insights/workspace:0.9.1' = {
  name: 'logAnalytics'
  scope: resourceGroup
  params: {
    name: '${prefix}-logs'
    location: location
    tags: tags
    skuName: 'PerGB2018'
    dataRetention: 30
  }
}

// Container Apps Environment
module containerAppsEnvironment 'br/public:avm/res/app/managed-environment:0.8.1' = {
  name: 'acaEnvironment'
  scope: resourceGroup
  params: {
    name: '${prefix}-env'
    location: location
    tags: tags
    logAnalyticsWorkspaceResourceId: logAnalytics.outputs.resourceId
    zoneRedundant: false
  }
}

// User-assigned managed identity for the container app
module managedIdentity 'br/public:avm/res/managed-identity/user-assigned-identity:0.4.0' = {
  name: 'containerAppIdentity'
  scope: resourceGroup
  params: {
    name: '${prefix}-identity'
    location: location
    tags: tags
  }
}


var openAiServiceName = '${prefix}-openai'
module openAi 'br/public:avm/res/cognitive-services/account:0.7.1' = {
  name: 'openai'
  scope: resourceGroup
  params: {
    name: openAiServiceName
    location: location
    tags: tags
    kind: 'OpenAI'
    sku: 'S0'
    disableLocalAuth: false
    customSubDomainName: openAiServiceName
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
    deployments: [
      {
        name: gptModelName
        model: {
          format: 'OpenAI'
          name: gptModelName
          version: gptModelVersion
        }
        sku: {
          name: 'GlobalStandard'
          capacity: gptDeploymentCapacity
        }
      }
      {
        name: embeddingModelName
        model: {
          format: 'OpenAI'
          name: embeddingModelName
          version: embeddingModelVersion
        }
        sku: {
          name: 'GlobalStandard'
          capacity: embeddingDeploymentCapacity
        }
      }
    ]
    roleAssignments: [
      {
        principalId: principalId
        roleDefinitionIdOrName: 'Cognitive Services OpenAI User'
        principalType: principalType
      }
      {
        principalId: principalId
        roleDefinitionIdOrName: 'Cognitive Services OpenAI Contributor'
        principalType: principalType
      }
      {
        principalId: managedIdentity.outputs.principalId
        roleDefinitionIdOrName: 'Cognitive Services OpenAI User'
        principalType: 'ServicePrincipal'
      }
    ]
  }
}


module aiSearch 'br/public:avm/res/search/search-service:0.11.1' = {
  name: 'aiSearch'
  scope: resourceGroup
  params: {
    name: '${prefix}-search'
    location: location
    sku: 'basic'
    tags: tags
    semanticSearch: 'standard'
    partitionCount: 1
    replicaCount: 1
    publicNetworkAccess: 'Enabled'
    disableLocalAuth: false
    authOptions: {
      aadOrApiKey: {
        aadAuthFailureMode: 'http401WithBearerChallenge'
      }
    }
    roleAssignments: [
      {
        principalId: principalId
        roleDefinitionIdOrName: 'Search Index Data Contributor'
        principalType: principalType
      }
      {
        principalId: principalId
        roleDefinitionIdOrName: 'Search Index Data Reader'
        principalType: principalType
      }
      {
        principalId: principalId
        roleDefinitionIdOrName: 'Search Service Contributor'
        principalType: principalType
      } 
      {
        principalId: principalId
        roleDefinitionIdOrName: 'Contributor'
        principalType: principalType
      }
      // Managed Identity needs full permissions to create index and upload documents
      {
        principalId: managedIdentity.outputs.principalId
        roleDefinitionIdOrName: 'Search Index Data Contributor'
        principalType: 'ServicePrincipal'
      }
      {
        principalId: managedIdentity.outputs.principalId
        roleDefinitionIdOrName: 'Search Index Data Reader'
        principalType: 'ServicePrincipal'
      }
      {
        principalId: managedIdentity.outputs.principalId
        roleDefinitionIdOrName: 'Search Service Contributor'
        principalType: 'ServicePrincipal'
      }
    ]
  }
}

// Container App
module containerApp 'br/public:avm/res/app/container-app:0.11.0' = {
  name: 'containerApp'
  scope: resourceGroup
  params: {
    name: '${prefix}-app'
    location: location
    tags: tags
    environmentResourceId: containerAppsEnvironment.outputs.resourceId
    managedIdentities: {
      userAssignedResourceIds: [managedIdentity.outputs.resourceId]
    }
    containers: [
      {
        name: 'api'
        image: 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest' // Placeholder, will be updated via azd deploy
        resources: {
          cpu: json('0.5')
          memory: '1Gi'
        }
        env: [
          {
            name: 'AZURE_AISEARCH_ENDPOINT'
            value: aiSearch.outputs.endpoint
          }
          {
            name: 'AZURE_AISEARCH_INDEX_NAME'
            value: 'northwind'
          }
          {
            name: 'AZURE_OPENAI_API_INSTANCE_NAME'
            value: openAi.outputs.name
          }
          {
            name: 'AZURE_OPENAI_COMPLETE_INSTANCE'
            value: openAi.outputs.name
          }
          {
            name: 'AZURE_OPENAI_COMPLETE_MODEL'
            value: gptModelName
          }
          {
            name: 'AZURE_OPENAI_COMPLETE_API_VERSION'
            value: gptApiVersion
          }
          {
            name: 'AZURE_OPENAI_COMPLETE_MAX_TOKENS'
            value: '1000'
          }
          {
            name: 'AZURE_OPENAI_EMBEDDING_INSTANCE'
            value: openAi.outputs.name
          }
          {
            name: 'AZURE_OPENAI_EMBEDDING_MODEL'
            value: embeddingModelName
          }
          {
            name: 'AZURE_OPENAI_EMBEDDING_API_VERSION'
            value: embeddingApiVersion
          }
          {
            name: 'SET_PASSWORDLESS'
            value: 'true'
          }
          {
            name: 'AZURE_CLIENT_ID'
            value: managedIdentity.outputs.clientId
          }
        ]
      }
    ]
    ingressTargetPort: 3000
    ingressExternal: true
    ingressTransport: 'http'
    scaleMinReplicas: 1
    scaleMaxReplicas: 3
    registries: [
      {
        server: containerRegistry.outputs.loginServer
        identity: managedIdentity.outputs.resourceId
      }
    ]
  }
}

// RBAC: Grant managed identity AcrPull role on Container Registry
module acrPullRoleAssignment 'br/public:avm/ptn/authorization/resource-role-assignment:0.1.1' = {
  name: 'acrPullRole'
  scope: resourceGroup
  params: {
    principalId: managedIdentity.outputs.principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d') // AcrPull role
    resourceId: containerRegistry.outputs.resourceId
    principalType: 'ServicePrincipal'
  }
}


// Resources
output AZURE_LOCATION string = location
output AZURE_TENANT_ID string = tenant().tenantId
output AZURE_RESOURCE_GROUP string = resourceGroup.name

// OpenAI Resource
output AZURE_OPENAI_API_INSTANCE_NAME string = openAi.outputs.name

// Embedding resource
output AZURE_OPENAI_EMBEDDING_INSTANCE string = openAi.outputs.name
output AZURE_OPENAI_EMBEDDING_MODEL string = embeddingModelName
output AZURE_OPENAI_EMBEDDING_API_VERSION string = embeddingApiVersion

// LLM resource
output AZURE_OPENAI_COMPLETE_INSTANCE string = openAi.outputs.name
output AZURE_OPENAI_COMPLETE_MODEL string = gptModelName
output AZURE_OPENAI_COMPLETE_API_VERSION string = gptApiVersion
output AZURE_OPENAI_COMPLETE_MAX_TOKENS int = 1000 // Set as needed

// Azure AI Search connection settings
output AZURE_AISEARCH_ENDPOINT string = aiSearch.outputs.endpoint
output AZURE_AISEARCH_INDEX_NAME string = 'northwind' // Set as needed

// Source code
output SET_PASSWORDLESS bool = true
output ENV_PATH string = '../../'

// Container App outputs
output CONTAINER_REGISTRY_NAME string = containerRegistry.outputs.name
output CONTAINER_REGISTRY_LOGIN_SERVER string = containerRegistry.outputs.loginServer
output AZURE_CONTAINER_REGISTRY_ENDPOINT string = containerRegistry.outputs.loginServer
output CONTAINER_APP_NAME string = containerApp.outputs.name
output CONTAINER_APP_FQDN string = containerApp.outputs.fqdn
output CONTAINER_APP_MANAGED_IDENTITY_CLIENT_ID string = managedIdentity.outputs.clientId
output CONTAINER_APP_MANAGED_IDENTITY_PRINCIPAL_ID string = managedIdentity.outputs.principalId

// Service mapping for azd
output SERVICE_API_NAME string = containerApp.outputs.name
output SERVICE_API_IMAGE_NAME string = 'langchain-api:latest'

