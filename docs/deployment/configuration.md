# Configuration

Financer is configured through environment variables. These can be set directly in `docker-compose.yml`, in a `.env` file, or passed to the container at runtime.

## Environment Variables

### Application

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `APP_ORIGIN` | Public URL of the application. Used for generating links in emails and for CORS configuration. | `http://localhost:3000` | Yes (for production) |
| `SESSION_SECRET_KEY` | Secret key used to encrypt session data. Must be a random, unique string. | — | **Yes** |
| `LOG_LEVEL` | Controls the verbosity of application logs. Accepted values: `DEBUG`, `INFO`, `WARNING`, `ERROR`. | `WARNING` | No |
| `DEMO_DATA` | When set to `true`, seeds the database with sample data on first startup. Useful for exploring the application. Set to `false` for production use. | `false` | No |
| `NODE_ENV` | Node.js environment mode. Should be `production` for deployments. | `production` | No |
| `PORT` | The port the application listens on inside the container. | `3000` | No |

### Database

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | MySQL connection string in the format `mysql://user:password@host:port/database`. | — | **Yes** |

When using the provided Docker Compose setup, this is constructed from the MySQL service configuration. Example:

```
mysql://financer:your-password@financer-db:3306/financer
```

### Redis

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REDIS_URL` | Redis connection string. Used for session storage and the background job queue. | — | **Yes** |

Example:

```
redis://financer-redis:6379
```

### MySQL Service

These variables configure the MySQL container (not the Financer application directly):

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MYSQL_ROOT_PASSWORD` | Root password for the MySQL server. | — | **Yes** |
| `MYSQL_DATABASE` | Name of the database to create on first startup. | `financer` | No |
| `MYSQL_USER` | Application database user. | `financer` | No |
| `MYSQL_PASSWORD` | Password for the application database user. | — | **Yes** |

## Admin Settings

In addition to environment variables, Financer has an **Admin Settings** panel accessible to system administrators through the web interface. These settings are stored in the database and can be changed at runtime without restarting the application.

### SMTP / Email

| Setting | Description | Default |
|---------|-------------|---------|
| SMTP Host | Hostname of the SMTP server | — |
| SMTP Port | Port of the SMTP server | — |
| SMTP User | Username for SMTP authentication | — |
| SMTP Password | Password for SMTP authentication | — |
| SMTP From Email | Sender email address | — |
| SMTP From Name | Sender display name | — |
| SMTP Encryption | Encryption method (e.g., TLS, STARTTLS) | — |

Configuring SMTP enables email features such as password reset links and member invitations.

### Registration

| Setting | Description | Default |
|---------|-------------|---------|
| Allow Registration | Whether new users can register without an invitation | `true` |

When disabled, new users can only join through invitation links.

### Security

| Setting | Description | Default |
|---------|-------------|---------|
| Invitation Token Expiration | Hours until an invitation link expires | `72` (3 days) |
| Reset Password Token Expiration | Hours until a password reset link expires | `4` |

### Household

| Setting | Description | Default |
|---------|-------------|---------|
| Allow Household Admins to Invite Users | Whether household admins (not just owners) can invite new users to the system | `true` |

### Defaults

| Setting | Description | Default |
|---------|-------------|---------|
| Default Language | Language for new users | `en-US` |
| Default Theme | Theme for new users (`light` or `dark`) | `light` |

### Onboarding

| Setting | Description | Default |
|---------|-------------|---------|
| Onboarding Completed | Whether the initial setup wizard has been completed | `false` |

This flag is set to `true` automatically after the onboarding wizard finishes. It prevents the onboarding from appearing again.

## Example `.env` File

A complete `.env` file for a production deployment:

```dotenv
# Application
SESSION_SECRET_KEY=a1b2c3d4e5f6g7h8i9j0-change-this
APP_ORIGIN=https://financer.example.com
LOG_LEVEL=WARNING
DEMO_DATA=false

# MySQL
MYSQL_ROOT_PASSWORD=strong-root-password
MYSQL_PASSWORD=strong-app-password

# Port (optional, defaults to 3000)
APP_PORT=3000
```

::: tip
Generate a secure session secret with:
```bash
openssl rand -hex 32
```
:::
