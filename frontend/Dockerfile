# Stage 1: Build base
FROM node:20-alpine as build-base
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine as appliance-prod
COPY --from=build-base /app/dist /usr/share/nginx/html
EXPOSE 80
EXPOSE 443
CMD ["nginx", "-g", "daemon off;"]

FROM node:20-alpine as saas-deploy
WORKDIR /app
RUN npm install -g serve
COPY --from=build-base /app/dist ./dist
CMD sh -c "serve -s dist -l ${PORT:-3000}"