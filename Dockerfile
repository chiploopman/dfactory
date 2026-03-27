FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-workspace.yaml turbo.json tsconfig.base.json tsconfig.json ./
COPY packages ./packages
COPY examples ./examples
RUN pnpm install --no-frozen-lockfile

FROM deps AS build
RUN pnpm build
RUN pnpm --filter @dfactory/cli build
RUN node packages/cli/dist/index.js build --ui-out-dir /app/.dfactory/ui

FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/.dfactory ./.dfactory
COPY --from=build /app/examples/react-starter ./examples/react-starter
EXPOSE 3210
USER node
CMD ["node", "packages/cli/dist/index.js", "serve", "--host", "0.0.0.0", "--port", "3210", "--config", "examples/react-starter/dfactory.config.ts", "--ui-dist-dir", ".dfactory/ui"]
