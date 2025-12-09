# Financer

A comprehensive personal finance management application built with Next.js, TypeScript, and Blitz.js.

## Features

- 🏠 **Household Management** - Create and manage multiple households with family collaboration
- 💰 **Transaction Tracking** - Record, categorize, and analyze your income and expenses
- 📊 **Categories & Tags** - Organize transactions with custom categories and flexible tagging
- 👥 **Counterparties** - Manage payees, payers, and recurring transaction partners
- 📈 **Dashboard & Analytics** - Visual reports, charts, and financial insights
- 📥 **Import & Export** - CSV import support and data export capabilities
- ⚙️ **Settings & Administration** - User profiles, preferences, and system configuration
- 🔐 **Secure Authentication** - User registration, login, and session management

## 🚀 Deployment

### Docker Deployment (Recommended)

The easiest way to deploy Financer is using Docker Compose:

1. **Download the docker-compose.yml file**:
   ```bash
   curl -o docker-compose.yml https://raw.githubusercontent.com/financer-project/financer/main/docker-compose.yml
   ```

1. **Start the application**:
   ```bash
   docker-compose up -d
   ```

1. **Access the application**:
    - Open your browser to `http://localhost:3000`
    - The application will be running with MySQL and Redis backends

### Environment Variables

The Docker setup uses the following default environment variables:

```
yaml
# Database
DATABASE_URL: mysql://root:password@financer-db:3306/financer

# Redis (for sessions and background jobs)
REDIS_URL: redis://financer-redis:6379

# Security (Change this for production!)
SESSION_SECRET_KEY: 63f4945d921d599f27ae4fdf5bada3f1
```

## License

See [BSD 3-Clause License](LICENSE)
