# ---------- Stage 1: Build ----------
FROM node:20-alpine AS builder

# Cài tool để build bcrypt (và lib native khác nếu có)
RUN apk add --no-cache python3 make g++

WORKDIR /usr/src/app

COPY package*.json ./
RUN yarn install --frozen-lockfile


# Copy source code
COPY . .

RUN yarn build

# ---------- Stage 2: Runtime (production) ----------
FROM node:20-alpine AS production

WORKDIR /usr/src/app
ENV NODE_ENV=production
  
# Copy only production dependencies
COPY package*.json ./

# Copy node_modules from builder stage (already compiled bcrypt)
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Copy dist from builder stage
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 8000

CMD ["node", "dist/main.js"]