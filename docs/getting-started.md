# Getting Started

This guide walks you through deploying Financer and creating your first household.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed on your system

## Quick Start with Docker Compose

1. **Create a project directory** and add a `docker-compose.yml` file:

   ```bash
   mkdir financer && cd financer
   ```

2. **Create the `docker-compose.yml`** file:

   ```yaml
   services:
     app:
       image: ghcr.io/financer-project/financer:latest
       container_name: financer-server
       environment:
         DATABASE_URL: mysql://financer:financer@financer-db:3306/financer
         REDIS_URL: redis://financer-redis:6379
         SESSION_SECRET_KEY: change-me-to-a-random-secret
         APP_ORIGIN: http://localhost:3000
         LOG_LEVEL: WARNING
         DEMO_DATA: "false"
       volumes:
         - ./data:/app/data
       ports:
         - "3000:3000"
       depends_on:
         mysql:
           condition: service_healthy
           restart: true
         redis:
           condition: service_started

     mysql:
       image: mysql:9
       container_name: financer-db
       environment:
         MYSQL_ROOT_PASSWORD: password
         MYSQL_DATABASE: financer
         MYSQL_USER: financer
         MYSQL_PASSWORD: financer
       healthcheck:
         test: ["CMD", "/usr/bin/mysql", "--user=root", "--password=password", "--execute", "SHOW DATABASES;"]
         interval: 10s
         timeout: 2s
         retries: 10
       volumes:
         - database:/var/lib/mysql

     redis:
       image: redis:alpine
       container_name: financer-redis
       volumes:
         - redis-data:/data
       command: redis-server --appendonly yes

   volumes:
     redis-data:
     database:
   ```

3. **Start the services:**

   ```bash
   docker compose up -d
   ```

4. **Open Financer** at [http://localhost:3000](http://localhost:3000).

5. **Complete the onboarding** wizard to set up your admin account and first household.

::: tip
On first startup, the database migrations run automatically. This may take a moment before the application becomes available.
:::

## Onboarding

When you access Financer for the first time, an onboarding wizard guides you through the initial setup:

1. **Create your admin account** - Enter your name, email, and password
2. **Configure system settings** - Set defaults for language and theme
3. **Create your first household** - Give it a name, description, and select a currency

After onboarding, you're taken to the dashboard where you can start adding accounts and transactions.

## First Steps After Setup

Once onboarding is complete, the recommended steps are:

1. **Create accounts** - Add your bank accounts, savings accounts, and other financial accounts under your household
2. **Set up categories** - Create income and expense categories to organize your transactions (e.g., Salary, Groceries, Rent)
3. **Add transactions** - Start recording your income and expenses manually, or import them from a CSV export from your bank
4. **Invite household members** - If you share finances with family, invite them to your household with appropriate roles

## Demo Data

If you want to explore Financer with sample data before entering your own, set the `DEMO_DATA` environment variable to `true`:

```yaml
environment:
  DEMO_DATA: "true"
```

This seeds the database with example households, accounts, categories, and transactions so you can explore all features immediately. Set it back to `false` once you're ready to use Financer with real data.

## Next Steps

- Learn about all [Features](/features/) in detail
- Read the [Deployment](/deployment/docker) guide for production configuration
- Review [Configuration](/deployment/configuration) options
