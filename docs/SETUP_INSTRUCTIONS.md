# DirectoryMonster Setup Instructions

This document provides instructions for setting up the DirectoryMonster application with the fixed CSS and rendering configuration.

## Getting Started with Docker

The simplest way to run DirectoryMonster is using Docker. Follow these steps:

1. **Start the Docker containers**:
   ```bash
   docker-compose up -d
   ```

2. **Seed the initial data**:
   ```bash
   # First install axios in the container
   docker exec directorymonster-app-1 npm install axios

   # Copy the seed script to the container
   # See seed-script.js in the repository

   # Run the seed script
   docker exec directorymonster-app-1 node /app/seed-script.js
   ```

3. **Access the application**:
   - Main application: http://localhost:3000/
   - Admin interface: http://localhost:3000/admin
   - Admin listings management: http://localhost:3000/admin/listings
   - API endpoints:
     - http://localhost:3000/api/healthcheck
     - http://localhost:3000/api/sites
     - http://localhost:3000/api/sites/fishing-gear/categories
     - http://localhost:3000/api/sites/fishing-gear/listings

## Multitenancy Testing

To test the multitenancy features, you can use the hostname parameter:

```
http://localhost:3000/?hostname=fishinggearreviews.com
http://localhost:3000/?hostname=hikinggearreviews.com
```

Or add these entries to your hosts file:
```
127.0.0.1 fishinggearreviews.com
127.0.0.1 hikinggearreviews.com
127.0.0.1 fishing-gear.mydirectory.com
127.0.0.1 hiking-gear.mydirectory.com
127.0.0.1 mydirectory.com
```

## Customizing the Application

### Tailwind CSS

The Tailwind CSS configuration has been fixed by:

1. Updating `globals.css` to use `@import` instead of `@tailwind` directives
2. Updating `postcss.config.js` to include the proper plugins
3. Ensuring all dependencies are installed in the Docker container

If you need to modify the Tailwind configuration, edit the following files:
- `tailwind.config.js`: Configure theme, plugins, and content paths
- `src/app/globals.css`: Add global styles and custom utilities
- `postcss.config.js`: Update PostCSS plugins

### Docker Configuration

The Docker configuration has been updated to:
- Use proper volume mounting for local development
- Install all necessary dependencies
- Configure the environment variables correctly

If you need to modify the Docker configuration, edit:
- `docker-compose.yml`: Main Docker configuration
- `Dockerfile`: Production Docker configuration

## Known Issues and Workarounds

1. **CSS Processing Error**:
   If you encounter CSS processing errors with Tailwind directives, ensure you're using `@import` instead of `@tailwind` in your CSS files.

2. **React Component Errors**:
   Avoid using async functions directly within React components. Instead, fetch all data at the top level of server components.

3. **Redis Connection Issues**:
   If Redis connection fails, the application will fall back to in-memory storage for development purposes.

## Troubleshooting

If you encounter issues:

1. Check Docker container logs:
   ```bash
   docker-compose logs app
   ```

2. Restart the containers:
   ```bash
   docker-compose restart app
   ```

3. Rebuild the containers:
   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

4. Verify the API is working:
   ```bash
   curl http://localhost:3000/api/healthcheck
   ```

For more detailed instructions, refer to the original README.md file.
