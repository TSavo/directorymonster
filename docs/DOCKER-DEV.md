# Docker Development Setup

## Hot Reloading Configuration

This project is configured for hot reloading in Docker, allowing you to edit files locally and see changes immediately without rebuilding containers.

### Key Components

1. **Webpack Configuration**
   - The Next.js configuration (next.config.js) includes webpack polling settings:
   ```js
   webpack: (config, { dev, isServer }) => {
     if (dev && !isServer) {
       config.watchOptions = {
         poll: 1000,         // Check for changes every second
         aggregateTimeout: 300, // Delay before rebuilding
         ignored: /node_modules/,
       };
     }
     return config;
   }
   ```

2. **Environment Variables**
   - .env.development contains file system watching settings:
   ```
   WATCHPACK_POLLING=true
   CHOKIDAR_USEPOLLING=true
   CHOKIDAR_INTERVAL=1000
   ```

3. **Docker Volume Mounting**
   - docker-compose.yml mounts the entire project directory:
   ```yaml
   volumes:
     - .:/app
     - /app/node_modules
     - /app/.next
   ```

4. **Next.js Dev Script**
   - package.json includes a docker-specific development script:
   ```json
   "dev:docker": "WATCHPACK_POLLING=true next dev --port 3000 --hostname 0.0.0.0"
   ```

## Development Workflow

### Starting the Development Environment

```bash
# Quick start with hot reloading
start-dev.bat

# Or use Docker Compose directly
docker-compose up -d
```

### Making Changes

Simply edit files in your local directory. Changes will be detected and reflected within a few seconds. File types that trigger hot reloading:

- JavaScript/TypeScript (.js, .ts, .jsx, .tsx)
- CSS/SCSS (.css, .scss)
- JSON files
- Static assets

### Testing Changes

```bash
# Check API endpoints
curl http://localhost:3000/api/healthcheck

# View logs to see file change detection
docker-compose logs -f app
```

### Reloading the Environment

If you need to restart the Next.js server without rebuilding:

```bash
dev-reload.bat
```

### Rebuilding the Environment

If you've made changes to dependencies or Docker configuration:

```bash
rebuild-dev.bat
```

## Troubleshooting

1. **Changes Not Detected**
   - Check Docker logs for file system events: `docker-compose logs -f app`
   - Ensure the correct volume mounting in docker-compose.yml
   - Try restarting the container: `dev-reload.bat`

2. **Performance Issues**
   - File polling can increase CPU usage
   - Consider excluding large directories from watching

3. **Build Issues**
   - Complete rebuild with no cache: `rebuild-dev.bat`
