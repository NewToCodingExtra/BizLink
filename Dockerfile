# BizLink on Railway — single service (web + queue + reverb + scheduler).
# Build context: repo root. Expects a Railway MySQL plugin + persistent volume.
FROM php:8.4-apache-bookworm

ENV DEBIAN_FRONTEND=noninteractive \
    APACHE_DOCUMENT_ROOT=/var/www/html/backend/public \
    COMPOSER_ALLOW_SUPERUSER=1

# System deps, PHP extensions, Node 20 (for the Vite build), supervisor.
RUN apt-get update && apt-get install -y --no-install-recommends \
        git unzip zip curl ca-certificates gnupg \
        libzip-dev libpng-dev libicu-dev libonig-dev \
        supervisor \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" > /etc/apt/sources.list.d/nodesource.list \
    && apt-get update && apt-get install -y --no-install-recommends nodejs \
    && docker-php-ext-configure intl \
    && docker-php-ext-install -j$(nproc) pdo_mysql mbstring bcmath zip gd intl opcache pcntl sockets exif \
    && a2enmod rewrite proxy proxy_http proxy_wstunnel headers \
    && rm -rf /var/lib/apt/lists/*

# mod_php requires prefork; the base image enables mpm_event, so swap it out.
RUN a2dismod mpm_event mpm_worker || true && a2enmod mpm_prefork

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# PHP deps first (better layer caching).
COPY backend/composer.json backend/composer.lock ./backend/
RUN cd backend && composer install --no-dev --no-scripts --no-autoloader --prefer-dist --ignore-platform-req=php+

# Full source, then frontend build (outputs to backend/public/build).
COPY backend ./backend
COPY frontend ./frontend
RUN cd backend && composer dump-autoload --optimize \
    && php artisan package:discover --ansi \
    && mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache
RUN cd frontend && npm ci --no-audit --no-fund && npm run build

# Apache vhost (port is templated from $PORT at boot) + supervisor.
COPY docker/apache-vhost.conf /etc/apache2/sites-available/000-default.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh \
    && rm -rf frontend/node_modules \
    && chown -R www-data:www-data backend/storage backend/bootstrap/cache backend/public

EXPOSE 80

CMD ["/usr/local/bin/entrypoint.sh"]
