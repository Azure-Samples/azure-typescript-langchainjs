FROM node:20-alpine AS build

WORKDIR /app

# Copy package.json files
COPY package*.json ./
COPY packages/langgraph-agent/package*.json ./packages/langgraph-agent/
COPY packages/server-api/package*.json ./packages/server-api/

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
COPY --from=build /app/packages/langgraph-agent/package*.json ./packages/langgraph-agent/
COPY --from=build /app/packages/langgraph-agent/dist ./packages/langgraph-agent/dist
COPY --from=build /app/packages/server-api/package*.json ./packages/server-api/
COPY --from=build /app/packages/server-api/dist ./packages/server-api/dist

# Install production dependencies only
RUN npm ci --omit=dev --workspace=packages/server-api --workspace=packages/langgraph-agent

# Expose port
EXPOSE 3000

# Run the server
CMD ["node", "packages/server-api/dist/server.js"]