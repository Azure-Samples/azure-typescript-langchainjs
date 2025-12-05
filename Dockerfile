FROM node:20-alpine AS build

WORKDIR /app

# Copy only package*.json files first (most stable layer)
COPY package*.json ./
COPY packages-v1/langgraph-agent/package*.json ./packages-v1/langgraph-agent/
COPY packages-v1/server-api/package*.json ./packages-v1/server-api/

# Install ALL dependencies with cache mount
RUN --mount=type=cache,target=/root/.npm \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install --workspace=packages-v1/server-api --workspace=packages-v1/langgraph-agent

# Copy TypeScript config and source files (changes more frequently)
COPY packages-v1/langgraph-agent/tsconfig.json ./packages-v1/langgraph-agent/
COPY packages-v1/langgraph-agent/src ./packages-v1/langgraph-agent/src
COPY packages-v1/server-api/tsconfig.json ./packages-v1/server-api/
COPY packages-v1/server-api/src ./packages-v1/server-api/src

# Build workspaces
RUN npm run build --workspace=packages-v1/langgraph-agent && \
    npm run build --workspace=packages-v1/server-api

# Prune dev dependencies
RUN npm prune --omit=dev

#-------------------------------------------------------------------------------------------
# Production image
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY --from=build /app/package*.json ./
COPY --from=build /app/packages-v1/langgraph-agent/package*.json ./packages-v1/langgraph-agent/
COPY --from=build /app/packages-v1/server-api/package*.json ./packages-v1/server-api/

# Copy production node_modules from build stage (all deps in root for workspaces)
COPY --from=build /app/node_modules ./node_modules

# Copy built artifacts from build stage
COPY --from=build /app/packages-v1/langgraph-agent/dist ./packages-v1/langgraph-agent/dist
COPY --from=build /app/packages-v1/server-api/dist ./packages-v1/server-api/dist

EXPOSE 3000

CMD ["node", "packages-v1/server-api/dist/server.js"]