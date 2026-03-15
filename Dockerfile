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
RUN NEXT_PUBLIC_GEMINI_API_KEY=$NEXT_PUBLIC_GEMINI_API_KEY npm run build

# Stage 2: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy everything from builder to ensure no missing config files
COPY --from=builder /app ./

# Cloud Run expects port 8080
EXPOSE 8080
ENV PORT 8080

# Start the application
CMD ["npm", "start"]
