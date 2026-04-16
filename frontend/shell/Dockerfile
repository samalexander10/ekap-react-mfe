FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies first (layer-cached)
COPY package.json ./
RUN npm install

# Copy source and build
COPY . .
# In production builds the remote URL must point to the Docker service name
ENV HR_NAMECHANGE_URL=http://hr-namechange/remoteEntry.js
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
