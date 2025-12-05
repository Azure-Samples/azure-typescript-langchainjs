import { DefaultAzureCredential } from "@azure/identity";

export const CREDENTIAL = new DefaultAzureCredential();

export const SCOPE_OPENAI = "https://cognitiveservices.azure.com/.default";

export async function azureADTokenProvider_OpenAI() {
  const tokenResponse = await CREDENTIAL.getToken(SCOPE_OPENAI);
  return tokenResponse.token;
}
