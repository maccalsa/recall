---
title: Docker
tags: [docker, containers, devops]
---

## Images

```bash
docker build -t myapp:1.0 .
docker build -f Dockerfile.prod -t myapp:prod .
docker images
docker pull nginx:latest
docker tag myapp:1.0 registry/myapp:1.0
docker push registry/myapp:1.0
docker rmi <image-id>
docker image prune -a              # remove unused images
```

## Containers

```bash
docker run -d --name web -p 8080:80 nginx
docker run -it --rm ubuntu bash    # interactive, remove on exit
docker run -e VAR=value ...
docker ps                          # running
docker ps -a                       # all
docker start|stop|restart <name>
docker exec -it <name> bash
docker logs -f <name>
docker rm <id>                     # remove stopped
docker rm -f <name>                # force remove running
```

## Volumes

```bash
docker volume create mydata
docker run -v mydata:/data ...
docker run -v $(pwd):/app ...      # bind mount
docker volume ls
docker volume inspect mydata
docker volume rm mydata
```

## Networks

```bash
docker network create mynet
docker network ls
docker run --network mynet --name db postgres
docker network connect mynet <container>
docker network inspect mynet
```

## Docker Compose

```bash
docker compose up -d               # detached
docker compose up --build
docker compose down
docker compose logs -f <service>
docker compose exec <service> sh
docker compose ps
docker compose pull
```

## Cleanup

```bash
docker system df
docker system prune                # unused data
docker system prune -a             # + unused images
docker container prune
```

## Inspect & Logs

```bash
docker inspect <id>
docker stats                       # live resource use
docker top <container>
docker logs --tail 100 -f <container>
docker events
```
