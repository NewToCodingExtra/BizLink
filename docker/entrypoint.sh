#!/bin/sh
set -e

# Railway injects $PORT; Apache listens on it.
APACHE_PORT="${PORT:-80}"
sed -i 's/:${APACHE_PORT}/*/:'"${APACHE_PORT}"'/' /etc/apache2/sites-available/000-default.conf
if grep -q '^Listen 80$' /etc/apache2/ports.conf 2>/dev/null; then
  sed -i "s/^Listen 80$/Listen ${APACHE_PORT}/" /etc/apache2/ports.conf
fi

cd /var/www/html/backend

# APP_KEY must exist before config:cache (Railway should provide it, but
# never fail the boot if it was forgotten).
if [ -z "$APP_KEY" ]; then
  php artisan key:generate --force
fi

# Writable paths (Railway volume should mount at .../backend/storage).
mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs storage/app/public bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

# Public disk symlink (ephemeral public/ is rebuilt from the image each boot).
php artisan storage:link || true

# Safe, idempotent boot steps (never :fresh here).
php artisan migrate --force
php artisan db:seed --class=RolesAndPermissionsSeeder --force || true

php artisan config:cache
php artisan route:cache
php artisan view:cache

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
