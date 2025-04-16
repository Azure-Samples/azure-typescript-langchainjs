FROM node:20-alpine AS build

WORKDIR /app

# Copy package.json files
COPY package*.json ./
COPY packages/langgraph_agent/package*.json ./packages/langgraph_agent/
COPY packages/server_api/package*.json ./packages/server_api/

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
COPY --from=build /app/packages/langgraph_agent/package*.json ./packages/langgraph_agent/
COPY --from=build /app/packages/langgraph_agent/dist ./packages/langgraph_agent/dist
COPY --from=build /app/packages/server_api/package*.json ./packages/server_api/
COPY --from=build /app/packages/server_api/dist ./packages/server_api/dist

# Install production dependencies only
RUN npm ci --omit=dev --workspace=packages/server_api --workspace=packages/langgraph_agent

# Expose port
EXPOSE 3000

# Run the server
CMD ["node", "packages/server_api/dist/server.js"]