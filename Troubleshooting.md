# Troubleshooting Guide

## 1. Model Not Found

- **Symptoms:**  
  - Error: `MODEL_NOT_FOUND`
- **Resolution:**  
  - Ensure both the **model name** and the **API version** are correct.
  - Note: The API version is different from the model version.
  - Double-check your deployment names and versions in the Azure Portal.

---

## 2. Authentication Issues

- **Symptoms:**  
  - Error: Authentication failed, 401/403, or token/key mismatch.
- **Resolution:**  
  - If using **passwordless (Entra ID) authentication**:
    - Remove all key-based environment variables from your runtime and `.env` file.
    - Only use the token credential.
  - If using **API key authentication**:
    - Ensure the correct key is present in your environment variables.
    - Do not set token credential variables.

---

## 3. Search Index Creation

- **Symptoms:**  
  - Error: `Error during Azure AI Search index initialization`
- **Resolution:**  
  - Check that the Azure AI Search service accepts both **API Keys** and **Role-Based Access Control (RBAC)**.
  - In the Azure Portal, go to your Search service’s **Keys** page and verify both authentication methods are enabled.
  - Ensure your identity has the required permissions (Search Service Contributor or Search Index Data Contributor).

---

## 4. Rate Limiting

- **Symptoms:**  
  - Error: `429 Rate limit is exceeded. Try again in XX seconds.`
- **Resolution:**  
  - Respect the `retry-after` header and wait before retrying.
  - Reduce batch size or request frequency.
  - Consider increasing your resource’s capacity or requesting a quota increase.

---

## 5. General Tips

- Always check Azure Portal for resource status and configuration.
- Review environment variables for typos or missing values.
- Use the latest Azure SDKs and LangChain versions.
- Consult official documentation for API versions and supported features.

---

## Useful Links

- [LangChain Error Reference](https://docs.langchain.com/oss/javascript/common-errors#errors)
- [Azure OpenAI Model Deployment](https://learn.microsoft.com/azure/ai-foundry/foundry-models/how-to/configure-project-connection?view=foundry-classic&pivots=ai-foundry-portal)
- [Azure AI Search Authentication](https://learn.microsoft.com/en-us/azure/search/search-security-overview#authentication)