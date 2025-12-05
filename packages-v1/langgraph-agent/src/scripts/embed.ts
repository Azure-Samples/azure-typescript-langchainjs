import {
  DefaultAzureCredential,
  getBearerTokenProvider,
} from "@azure/identity";
import { AzureOpenAIEmbeddings } from "@langchain/openai";
try {
  const credentials = new DefaultAzureCredential();
  const azureADTokenProvider = getBearerTokenProvider(
    credentials,
    "https://cognitiveservices.azure.com/.default",
  );

  const modelWithManagedIdentity = new AzureOpenAIEmbeddings({
    azureADTokenProvider,
    azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME!,
    azureOpenAIApiEmbeddingsDeploymentName:
      process.env.AZURE_OPENAI_EMBEDDING_MODEL!,
    azureOpenAIApiVersion: process.env.AZURE_OPENAI_EMBEDDING_API_VERSION!,
    azureOpenAIBasePath: `https://${process.env.AZURE_OPENAI_API_INSTANCE_NAME}.openai.azure.com/openai/deployments`,
  });

  const vectors = await modelWithManagedIdentity.embedDocuments([
    "Hello world",
    "Bonjour le monde",
  ]);
  console.log("Embeddings with Managed Identity:");
  console.log(vectors);
} catch (error) {
  console.error("Error using Managed Identity for embeddings:", error);
}
