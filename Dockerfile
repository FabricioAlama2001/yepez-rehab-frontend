FROM node:22-alpine AS build

WORKDIR /app

ARG API_URL=/api

COPY package*.json ./
RUN npm ci

COPY . .

RUN sed -i "s|apiUrl: '[^']*'|apiUrl: '${API_URL}'|g" src/environments/environment.ts
RUN npm run build

FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/yepez-rehab-frontend/browser/ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
