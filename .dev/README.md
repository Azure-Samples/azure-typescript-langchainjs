# To validate 

- This sample was tested on Windows 11 host.
- IDE was Visual Studio Code. Verified it also works on CodeSpaces.
- Run with two terminals.
- Last validation 12/05/2025

## Times

- `azd up` - usually less than 10 minutes.
- `azd down --purge` - 8 minutes

## Troubleshooting

- Need to wait until all 263 docs are indexed in AI Search
- Need to make sure you have both AZ (AZD hooks in azure.yaml) and AZD auth
- Short env var name - 7 char - no uppercase
