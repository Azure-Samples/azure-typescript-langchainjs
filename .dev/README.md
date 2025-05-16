# To validate 

* This sample was tested on Windows 11 host.
* IDE was Visual Studio Code. 
* Run with two terminals. 

## Do not

* Run in a dev container or in GitHub Code spaces.

## Troubleshooting

* See linked package: `npm ls --link --all`


    ```
    $ npm ls --link --all
    azure-typescript-langchainjs@1.0.0 C:\Users\diberry\repos\diberry\azure-typescript-langchainjs-2
    ├── langgraph-agent@1.0.0 -> .\packages\langgraph-agent
    └─┬ server-api@1.0.0 -> .\packages\server-api
      └── langgraph-agent@1.0.0 deduped -> .\packages\langgraph-agent
    ```
    