# Stage 1: Build the React application
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:stable-alpine
# Copy the static build files from the previous stage
COPY --from=build /app/build /usr/share/nginx/html
# Nginx listens on port 80 by default
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]