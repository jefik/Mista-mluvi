# --- FÁZE 1: Build ---
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- FÁZE 2: Nginx ---
FROM nginx:stable-alpine

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_KEY=$VITE_API_KEY
ENV VITE_MAP_API_KEY=$VITE_MAP_API_KEY

# Kopírování buildu z Vite (dist) do Nginxu
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]