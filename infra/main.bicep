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
    ]
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

