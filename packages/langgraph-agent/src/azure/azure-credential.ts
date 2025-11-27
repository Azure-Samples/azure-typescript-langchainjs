import { DefaultAzureCredential, getBearerTokenProvider } from "@azure/identity";

export const CREDENTIAL = new DefaultAzureCredential();

export const SCOPE_OPENAI = "https://cognitiveservices.azure.com/.default";
export const SCOPE_SEARCH = "https://search.azure.com/.default";

export const azureADTokenProvider_OpenAI = getBearerTokenProvider(CREDENTIAL, SCOPE_OPENAI);
export const azureADTokenProvider_Search = getBearerTokenProvider(CREDENTIAL, SCOPE_SEARCH);