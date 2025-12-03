FROM node:20-alpine AS build

WORKDIR /app

# Copy package.json files
COPY package.json ./
COPY packages-v1/langgraph-agent/package.json ./packages-v1/langgraph-agent/
COPY packages-v1/server-api/package.json ./packages-v1/server-api/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build packages
RUN npm run build --workspaces
#-------------------------------------------------------------------------------------------
# Production image
FROM node:20-alpine

WORKDIR /app

# Copy package files and built artifacts
COPY --from=build /app/package*.json ./
COPY --from=build /app/packages-v1/langgraph-agent/package*.json ./packages-v1/langgraph-agent/
COPY --from=build /app/packages-v1/langgraph-agent/dist ./packages-v1/langgraph-agent/dist
COPY --from=build /app/packages-v1/server-api/package*.json ./packages-v1/server-api/
COPY --from=build /app/packages-v1/server-api/dist ./packages-v1/server-api/dist

# Install production dependencies only
RUN npm ci --omit=dev --workspace=packages-v1/server-api --workspace=packages-v1/langgraph-agent

# Expose port
EXPOSE 3000

# Run the server
CMD ["node", "packages-v1/server-api/dist/server.js"]