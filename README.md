# nest-mongo-docker-env

## DEV启动

启动nodejs服务器、mongodb、mongo-express
```bash

docker-compose up -d dev mongodb mongo-express # 启动

docker ps  # 查看各个容器状态

docker logs server-dev 
docker logs server-dev -f # 持续输出logs
docker exec -it server-mongodb bash # 进入mongo容器
```

### 参考
- [Setting up a NestJS project with Docker for Back-End development](https://dev.to/erezhod/setting-up-a-nestjs-project-with-docker-for-back-end-development-30lg)
- [Containerized development with NestJS and Docker](https://blog.logrocket.com/containerized-development-nestjs-docker/)
- [How To Run MongoDB as a Docker Container](https://www.bmc.com/blogs/mongodb-docker-container/)
- [Containerize Nest.js+MongoDB application in 5 minutes](https://www.programmersought.com/article/16254481182/)
- [accessing a docker container from another container](https://stackoverflow.com/questions/42385977/accessing-a-docker-container-from-another-container)
- [From inside of a Docker container, how do I connect to the localhost of the machine?](https://stackoverflow.com/questions/24319662/from-inside-of-a-docker-container-how-do-i-connect-to-the-localhost-of-the-mach)
- [Docker从入门到实践](https://yeasy.gitbook.io/docker_practice/compose/compose_file)
- [Eggjs Dockerfile](https://github.com/eggjs/docker/blob/master/Dockerfile)
- [`@nestjs/mongoose`](https://github.com/nestjs/mongoose)