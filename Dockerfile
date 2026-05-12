# ==========================================
# STAGE 1: Build static assets
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency specifications and install cleanly
COPY package*.json ./
RUN npm install

# Copy full application code and compile
COPY . .
RUN npm run build

# ==========================================
# STAGE 2: Serve compiled assets with Nginx
# ==========================================
FROM nginx:stable-alpine

# Overwrite default Nginx server configuration with SPA routing rules & static file caching
RUN echo 'server { \
    listen 8080; \
    server_name localhost; \
    add_header X-Frame-Options "DENY" always; \
    add_header X-Content-Type-Options "nosniff" always; \
    add_header Referrer-Policy "strict-origin-when-cross-origin" always; \
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always; \
    \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"; \
        expires -1; \
    } \
    \
    location ~* \.(?:css|js|webp|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \
        root /usr/share/nginx/html; \
        add_header Cache-Control "public, max-age=31536000, immutable"; \
        access_log off; \
    } \
    \
    error_page 500 502 503 504 /50x.html; \
    location = /50x.html { \
        root /usr/share/nginx/html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Copy production assets from Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
