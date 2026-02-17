# Docker Deployment

Financer is distributed as a Docker image and is designed to be deployed with Docker Compose alongside MySQL and Redis.

## Architecture

A Financer deployment consists of three services:

| Service | Image | Purpose |
|---------|-------|---------|
| **App** | `ghcr.io/financer-project/financer:latest` | The Financer application (Next.js) |
| **MySQL** | `mysql:9` | Primary database for all application data |
| **Redis** | `redis:alpine` | Session storage and background job queue |

## Docker Compose

Create a `docker-compose.yml` file:

```yaml
services:
  app:
    image: ghcr.io/financer-project/financer:latest
    container_name: financer-server
    environment:
      DATABASE_URL: mysql://financer:${MYSQL_PASSWORD:-financer}@financer-db:3306/financer
      REDIS_URL: redis://financer-redis:6379
      SESSION_SECRET_KEY: ${SESSION_SECRET_KEY:?Set a session secret}
      APP_ORIGIN: ${APP_ORIGIN:-http://localhost:3000}
      LOG_LEVEL: ${LOG_LEVEL:-WARNING}
      DEMO_DATA: ${DEMO_DATA:-false}
    volumes:
      - app-data:/app/data
    ports:
      - "${APP_PORT:-3000}:3000"
    depends_on:
      mysql:
        condition: service_healthy
        restart: true
      redis:
        condition: service_started
    restart: unless-stopped

  mysql:
    image: mysql:9
    container_name: financer-db
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-password}
      MYSQL_DATABASE: financer
      MYSQL_USER: financer
      MYSQL_PASSWORD: ${MYSQL_PASSWORD:-financer}
    healthcheck:
      test:
        [
          "CMD",
          "/usr/bin/mysql",
          "--user=financer",
          "--password=${MYSQL_PASSWORD:-financer}",
          "--execute",
          "SHOW DATABASES;",
        ]
      interval: 10s
      timeout: 2s
      retries: 10
    volumes:
      - database:/var/lib/mysql
    restart: unless-stopped

  redis:
    image: redis:alpine
    container_name: financer-redis
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    restart: unless-stopped

volumes:
  app-data:
  redis-data:
  database:
```

## Environment File

Create a `.env` file alongside your `docker-compose.yml` to configure the deployment:

```dotenv
# Session secret - MUST be changed for production
SESSION_SECRET_KEY=your-random-secret-key-here

# Application URL (used for email links and CORS)
APP_ORIGIN=https://financer.example.com

# MySQL passwords
MYSQL_ROOT_PASSWORD=a-strong-root-password
MYSQL_PASSWORD=a-strong-user-password

# Log level
LOG_LEVEL=WARNING

# Port mapping (host port)
APP_PORT=3000

# Demo data (set to true to seed sample data)
DEMO_DATA=false
```

::: danger Important
Always change `SESSION_SECRET_KEY` and database passwords before deploying to production. The default values are insecure and intended only for local testing.
:::

## Starting the Services

```bash
docker compose up -d
```

On first startup, Financer automatically runs database migrations before starting the application server. Subsequent starts skip already-applied migrations.

## Updating

To update to the latest version:

```bash
docker compose pull
docker compose up -d
```

Database migrations are applied automatically on each startup, so schema changes are handled without manual intervention.

## Data Persistence

Three Docker volumes ensure data survives container restarts:

| Volume | Purpose |
|--------|---------|
| `app-data` | Transaction attachments and imported CSV files |
| `database` | MySQL data files |
| `redis-data` | Redis persistence (sessions, job queue) |

## Reverse Proxy

In production, you should place Financer behind a reverse proxy (e.g., Nginx, Traefik, Caddy) that handles TLS termination. Set `APP_ORIGIN` to your public URL (e.g., `https://financer.example.com`).

Example with Traefik labels:

```yaml
services:
  app:
    image: ghcr.io/financer-project/financer:latest
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.financer.rule=Host(`financer.example.com`)"
      - "traefik.http.routers.financer.tls.certresolver=letsencrypt"
      - "traefik.http.services.financer.loadbalancer.server.port=3000"
    # Remove the ports section when using a reverse proxy
    # ports:
    #   - "3000:3000"
```

## Health Check

The application exposes a health check endpoint at `/api/health-check` that can be used for monitoring and orchestration:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/api/health-check"]
  interval: 30s
  timeout: 5s
  retries: 3
```

## Logs

View application logs:

```bash
# All services
docker compose logs -f

# App only
docker compose logs -f app

# Last 100 lines
docker compose logs --tail 100 app
```

Adjust the `LOG_LEVEL` environment variable to control verbosity. See the [Configuration](/deployment/configuration) page for all options.
