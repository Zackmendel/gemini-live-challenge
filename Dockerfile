# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# 1. Define the ARG (passed from Cloud Build)
ARG NEXT_PUBLIC_GEMINI_API_KEY

# 2. RUN the build with the variable explicitly injected into the shell
# This is the "Force Fix" for Next.js client-side exceptions
RUN NEXT_PUBLIC_GEMINI_API_KEY=$NEXT_PUBLIC_GEMINI_API_KEY npm run build

# Stage 2: Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy built assets and necessary files from builder
COPY --from=builder /app/next.config.mjs ./next.config.mjs || true
COPY --from=builder /app/next.config.js ./next.config.js || true
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Standard Cloud Run port
EXPOSE 8080
ENV PORT 8080

CMD ["npm", "start"]
