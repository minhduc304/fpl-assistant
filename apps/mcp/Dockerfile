# Build from the monorepo root: docker build -f apps/mcp/Dockerfile .
# (apps/mcp depends on the sibling workspace package @fpl-assistant/api-client,
# so the build context must include the repo root, not just apps/mcp/.)

FROM node:22-alpine AS build
WORKDIR /repo

# Install deps first (better layer caching) — only the manifests needed to
# resolve the apps/mcp + packages/api-client workspace pair.
COPY package.json package-lock.json ./
COPY apps/mcp/package.json apps/mcp/package.json
COPY packages/api-client/package.json packages/api-client/package.json
RUN npm ci

# Now bring in the source and build apps/mcp (emits dist/ with no test files).
COPY tsconfig.json ./tsconfig.json
COPY apps/mcp/tsconfig.json apps/mcp/tsconfig.build.json apps/mcp/
COPY apps/mcp/src apps/mcp/src
COPY packages/api-client/src packages/api-client/src
COPY packages/api-client/generated packages/api-client/generated
RUN npm run build --workspace=apps/mcp


FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# @fpl-assistant/api-client ships its TS source as its package "main" (no
# build step of its own) — the runtime needs Node's type-stripping to import
# it directly.
ENV NODE_OPTIONS=--experimental-strip-types

COPY package.json package-lock.json ./
COPY apps/mcp/package.json apps/mcp/package.json
COPY packages/api-client/package.json packages/api-client/package.json
RUN npm ci --omit=dev

COPY packages/api-client/src packages/api-client/src
COPY packages/api-client/generated packages/api-client/generated
COPY --from=build /repo/apps/mcp/dist apps/mcp/dist

WORKDIR /app/apps/mcp
EXPOSE 3100
CMD ["node", "dist/index.js"]
