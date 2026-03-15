# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Capture the Build Argument from Cloud Build
ARG NEXT_PUBLIC_GEMINI_API_KEY

# FORCE the variable into the Next.js build command
# This 'bakes' the key into the static JS files for the browser
RUN NEXT_PUBLIC_GEMINI_API_KEY=$NEXT_PUBLIC_GEMINI_API_KEY npm run build

# Stage 2: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Only copy what's necessary to run (keeps the image small)
COPY --from=builder /app/next.config.mjs ./next.config.mjs || true
COPY --from=builder /app/next.config.js ./next.config.js || true
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Cloud Run expects port 8080
EXPOSE 8080
ENV PORT 8080

CMD ["npm", "start"]
