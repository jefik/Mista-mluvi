FROM node:20-slim

# Nastavení produkčního prostředí hned na začátku
ENV IS_DEV=false
ENV PORT=$PORT
ENV API_KEY=$API_KEY
ENV APP_URL=$API_URL

WORKDIR /app

# Předpokládám, že Dockerfile pouštíte z kořene projektu, kde je složka 'backend'
COPY ./package*.json ./

# Instalace pouze produkčních závislostí
RUN npm ci --only=production

# Vytvoření složky pro databazi
RUN mkdir -p /app/data

# Kopírování zdrojového kódu (včetně package.json z řádku 14, pokud je v src potřeba)
COPY /src ./src

# Dobrá praxe: Nepoužívejte root uživatele, pokud to není nutné
USER node

EXPOSE 3000

# Přímé spuštění přes node je v produkci stabilnější
CMD ["node", "src/server.js"]