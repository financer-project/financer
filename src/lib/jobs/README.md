# Background Job Processing

This directory contains the infrastructure for background job processing in the Financer application.

## Overview

The application uses [BullMQ](https://docs.bullmq.io/) for background job processing, which requires a Redis server.

## Setup

1. Make sure you have Redis installed and running. You can:
   - Download it from [redis.io](https://redis.io/download)
   - Use the development Docker Compose setup: `docker-compose -f docker/docker-compose.dev.yml up -d`
   - Use a standalone Docker container

2. Set the `REDIS_URL` environment variable in your `.env.local` file:

```
REDIS_URL=redis://localhost:6379
```

When using the development Docker Compose setup, Redis will be available at the default port (6379).

> **Important**: The Redis connection in `index.ts` is configured with `maxRetriesPerRequest: null`. This is required by BullMQ and should not be changed, or you may encounter the error "Your redis options maxRetriesPerRequest must be null".

## Job Queues

### Import Queue

The import queue is used for processing CSV import jobs. When a user submits an import job through the Import Wizard, the job is added to the queue and processed in the background.

The queue is defined in `index.ts` and the worker is initialized in `init.server.ts`.

## Adding New Job Types

To add a new type of background job:

1. Add a new queue and worker in `index.ts`
2. Create a processor function for the job
3. Add a function to queue the job
4. Update the worker initialization in `init.server.ts`

## Monitoring

Currently, there is no built-in monitoring for the job queues. In a production environment, you might want to add a monitoring solution like [Bull Board](https://github.com/felixmosh/bull-board) or [Bull Monitor](https://github.com/s-r-x/bull-monitor).
