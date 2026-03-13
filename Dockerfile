# Use Node 20
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Catch the secret from Cloud Build and make it available to Next.js
ARG NEXT_PUBLIC_GEMINI_API_KEY
ENV NEXT_PUBLIC_GEMINI_API_KEY=$NEXT_PUBLIC_GEMINI_API_KEY

RUN npm run build

# Runner stage
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 8080
CMD ["npm", "start"]
