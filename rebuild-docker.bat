@echo off
REM rebuild-docker.bat

echo Stopping all running containers...
docker-compose down

echo Removing containers...
FOR /F "tokens=*" %%a IN ('docker ps -a -q') DO (
    echo %%a
    docker rm -f %%a 2>NUL
)

echo Removing images...
FOR /F "tokens=*" %%a IN ('docker images directorymonster* -q') DO (
    docker rmi %%a 2>NUL
)

echo Rebuilding docker containers with no cache...
docker-compose build --no-cache

echo Starting containers...
docker-compose up -d

echo Waiting for services to start...
timeout /t 10

echo Checking container status...
docker-compose ps

echo Application logs:
docker-compose logs app --tail=50

echo Docker rebuild complete!
