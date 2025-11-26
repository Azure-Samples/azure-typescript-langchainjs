# Troubleshooting

## Model not found

Both the model name and the API version much be correct. The API version is different from the model version. 

## Authentication issues

If you are using the passwordless connection which uses the token credential, you shouldn't have the any of the key-based environment variables in the runtime, including the .env file. 

## Search index

Index create fails: "Error during Azure AI Search index initialization"  - check that the service accepts both API Keys and Role based access control on the Keys page of the service in the portal.