#!/bin/sh
set -e

# Railway injects $PORT; Apache listens on it.
APACHE_PORT="${PORT:-80}"
sed -i "s/\${APACHE_PORT}/${APACHE_PORT}/g" /etc/apache2/sites-available/000-default.conf
sed -i "s/^Listen [0-9]\+/Listen ${APACHE_PORT}/" /etc/apache2/ports.conf 2>/dev/null || true

cd /var/www/html/backend

# APP_KEY must exist before config:cache (Railway should provide a stable
# one — this fallback only saves the boot; exported so every child process
# and the cached config see the same key).
if [ -z "$APP_KEY" ]; then
  export APP_KEY="base64:$(head -c 32 /dev/urandom | base64)"
fi

if [ -n "$REVERB_APP_KEY" ]; then
  export BROADCAST_CONNECTION="${BROADCAST_CONNECTION:-reverb}"
fi

# Writable paths (Railway volume should mount at .../backend/storage).
mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs storage/app/public bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# Public disk symlink (ephemeral public/ is rebuilt from the image each boot).
php artisan storage:link || true

# Wait for database connection before running migrations
echo "Waiting for database connection..."
for i in $(seq 1 30); do
  if php artisan tinker --execute="DB::connection()->getPdo();" >/dev/null 2>&1; then
    echo "Database connected."
    break
  fi
  echo "Waiting for database to become available ($i/30)..."
  sleep 2
done

# Safe, idempotent boot steps (never :fresh here).
php artisan migrate --force
php artisan db:seed --force || true

php artisan config:cache
php artisan route:cache
php artisan view:cache

# Ensure only mpm_prefork is loaded and remove any stale Apache PID file from prior restarts
rm -f /etc/apache2/mods-enabled/mpm_event.* /etc/apache2/mods-enabled/mpm_worker.* 2>/dev/null || true
a2dismod mpm_event mpm_worker 2>/dev/null || true
a2enmod mpm_prefork 2>/dev/null || true
rm -f /var/run/apache2/apache2.pid 2>/dev/null || true

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
