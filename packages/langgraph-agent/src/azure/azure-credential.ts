import { DefaultAzureCredential } from "@azure/identity";

export const CREDENTIAL = new DefaultAzureCredential();

export const SCOPE_OPENAI = "https://cognitiveservices.azure.com/.default";
export const SCOPE_SEARCH = "https://search.azure.com/.default";

export async function azureADTokenProvider_OpenAI() {
  const tokenResponse = await CREDENTIAL.getToken(SCOPE_OPENAI);
  return tokenResponse.token;
}

export async function azureADTokenProvider_Search() {
  const tokenResponse = await CREDENTIAL.getToken(SCOPE_SEARCH);
  return tokenResponse.token;
}
