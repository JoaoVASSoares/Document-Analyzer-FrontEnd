# Build da SPA (configuração "docker": baseUrl relativo + proxy Nginx)
FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx ng build --configuration=docker

# Servir ficheiros estáticos + reverse proxy para a API
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/verifydoc-front/browser /usr/share/nginx/html

EXPOSE 80
