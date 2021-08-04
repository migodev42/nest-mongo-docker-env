# nest-mongo-docker-env

## 简介
本仓库使用 `Docker` 搭建了一个 `NestJS` + `MongoDB` 的开发环境。

要成功的将代码运行起来，并理解每个部分的工作原理，你至少需要对以下的知识点有基本的了解：

- `JavaScript` & `TypeScript`
- `Docker` 的基本使用
- `MongoDB` 的基本使用

## 前置条件
- 安装 [`Docker`](https://docs.docker.com/get-docker/) 和 [`Docker-Compose`](https://docs.docker.com/compose/install/)
- 安装 [`NodeJS`](https://nodejs.org/)

## 开始搭建
主要步骤：
1. 创建 `NestJS` 项目
2. 容器化 `NestJS` 项目
3. 使用 `Docker-Compose` 编排容器
4. 在 `NestJS` 项目中连接 `MongoDB` 服务

### 创建 `NestJS` 项目
[Introduction | NestJS](https://docs.nestjs.com/)

``` bash
$ npm i -g @nestjs/cli
$ nest new project-name
```
使用 `nest new` 命令创建完成后，`cd` 到 `project-name` 项目根目录执行 `start:dev`。

打开浏览器访问 `http://localhost:3000`，能正常访问就说明`NestJS` 项目已经创建好了。

### 容器化 `NestJS` 项目
在这个步骤，我们需要刚刚创建的`NestJS` 项目打包成一个 `Docker` 容器。

1. 首先在 `NestJS` 项目根目录新建一个 `Dockerfile` 文件
``` bash
$ touch Dockerfile
```
2. 修改 `Dockerfile` 文件内容
```

# Docker多阶段构建

### DEV环境 ###
FROM node:14.17.3 AS development

# 定位到容器工作目录
WORKDIR /usr/src/app
# 拷贝package.json
COPY package*.json ./

RUN npm install glob rimraf
RUN npm install --only=development
COPY . .
RUN npm run build


### PROD环境 ###
FROM node:14.17.3 as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

RUN \
  npm config set registry https://registry.npm.taobao.org \
  && npm install --only=production

COPY . .

COPY --from=development /usr/src/app/dist ./dist

CMD ["node", "dist/main"]
```

这样一个 `NestJS` 项目的 `Docker` 镜像就定制好了。
> 由于还有 `MongoDB` 相关的容器服务，我们不直接使用 `Docker` 命令来构建、运行，而是使用 `Docker-Compose` 编排容器。

### 使用 `Docker-Compose` 编排容器
`Docker-Compose` 的 `docker-compose.yml` 配置文件可以将一组相关联的应用容器定义为一个项目，这样我们可以很方便的管理 `NestJS` 和 `MongoDB` 的服务。

1. 在 `NestJS` 项目根目录新建一个 `docker-compose.yml` 文件
``` bash
$ touch docker-compose.yml
```
2. 修改 `docker-compose.yml` 文件内容
``` 
version: '3.9'
services:
  dev:
    container_name: server-dev
    image: server-dev:1.0.0
    build:
      context: .
      target: development
      dockerfile: ./Dockerfile
    command: npm run start:debug
    ports:
      - 3000:3000
      - 9229:9229
    networks:
      - server-network
    volumes:
      - .:/usr/src/app
      - /usr/src/app/node_modules
    restart: unless-stopped
    environment:
      MONGO_URL: mongodb
  prod:
    container_name: server-prod
    image: server-prod:1.0.0
    build:
      context: .
      target: production
      dockerfile: ./Dockerfile
    command: npm run start:prod
    ports:
      - 3000:3000
      - 9229:9229
    networks:
      - server-network
    volumes:
      - .:/usr/src/app
      - /usr/src/app/node_modules
    restart: unless-stopped
  mongodb:
    image: mongo:5.0.0
    container_name: server-mongodb
    environment:
      - MONGO_INITDB_ROOT_USERNAME=root
      - MONGO_INITDB_ROOT_PASSWORD=pass12345
    volumes:
      - mongodb-data:/data/db
    networks:
      - server-network
    ports:
      - 27017:27017
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongo localhost:27017/test --quiet
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
  mongo-express:
    image: mongo-express
    container_name: server-mongo-express
    environment:
      - ME_CONFIG_MONGODB_SERVER=mongodb
      - ME_CONFIG_MONGODB_ENABLE_ADMIN=true
      - ME_CONFIG_MONGODB_ADMINUSERNAME=root
      - ME_CONFIG_MONGODB_ADMINPASSWORD=pass12345
      - ME_CONFIG_BASICAUTH_USERNAME=admin
      - ME_CONFIG_BASICAUTH_PASSWORD=admin123
    volumes:
      - mongodb-data
    depends_on:
      - mongodb
    networks:
      - server-network
    ports:
      - 8081:8081
    healthcheck:
      test: wget --quiet --tries=3 --spider http://admin:admin123@localhost:8081 || exit 1
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
volumes:
  mongodb-data:
    name: mongodb-data
networks:
  server-network:
```

到这一步，我们已经完成了容器化的所有步骤，剩下的就是在 `NestJS` 去连接 `MongoDB` 服务。

### 在 `NestJS` 项目中连接 `MongoDB` 服务
我们使用 `NestJS` 推荐的 `@nestjs/mongoose` 工具来连接 `MongoDB` 服务。

1. 安装 `@nestjs/mongoose`
``` bash
$ npm install --save @nestjs/mongoose mongoose 
# or yarn
$ yarn add -D @nestjs/mongoose mongoose 
```

2. 连接 `MongoDB` 服务

`app.module.ts`
``` ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';

const url = process.env.MONGO_URL || 'localhost';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    MongooseModule.forRoot(
      `mongodb://${url}:27017?serverSelectionTimeoutMS=2000&authSource=admin`,
    ),
  ],
})
export class AppModule {}
```
> 需要注意的是我们使用的 `mongodb` 连接地址 `process.env.MONGO_URL` 是 `docker-compose.yml` 中定义的 `mongodb` 服务的地址，参考 [Accessing a docker container from another container。](https://stackoverflow.com/questions/42385977/accessing-a-docker-container-from-another-container)

## 启动项目
现在，我们已经完成了所有的配置工作，可以把项目给跑起来了。

启动 `NestJS` 服务、`Mongo` 服务和 `Mongo-Express` 服务

```bash
$ docker-compose up -d dev mongodb mongo-express
```

>注意：当你使用 `npm` 安装了新的 `package` 时，需要使用 `-V` 参数来重新创建容器的 `node_modules` 匿名数据卷。
``` bash
$ docker-compose up -d -V dev
```

查看各个容器的状态
``` bash
$ docker ps 
```

查看容器的日志
``` bash
$ docker logs server-dev 
$ docker logs server-dev -f # -f 用于参数持续输出logs
```
进入容器 `shell`
``` bash
$ docker exec -it server-mongodb bash # 进入mongo容器
```
### 参考资料
- [Setting up a NestJS project with Docker for Back-End development](https://dev.to/erezhod/setting-up-a-nestjs-project-with-docker-for-back-end-development-30lg)
- [Containerized development with NestJS and Docker](https://blog.logrocket.com/containerized-development-nestjs-docker/)
- [How To Run MongoDB as a Docker Container](https://www.bmc.com/blogs/mongodb-docker-container/)
- [Containerize Nest.js+MongoDB application in 5 minutes](https://www.programmersought.com/article/16254481182/)
- [Accessing a docker container from another container](https://stackoverflow.com/questions/42385977/accessing-a-docker-container-from-another-container)
- [From inside of a Docker container, how do I connect to the localhost of the machine?](https://stackoverflow.com/questions/24319662/from-inside-of-a-docker-container-how-do-i-connect-to-the-localhost-of-the-mach)
- [Docker从入门到实践](https://yeasy.gitbook.io/docker_practice/compose/compose_file)
- [Eggjs Dockerfile](https://github.com/eggjs/docker/blob/master/Dockerfile)
- [`@nestjs/mongoose`](https://github.com/nestjs/mongoose)
- [Docker-compose: node_modules not present in a volume after npm install succeeds](https://stackoverflow.com/a/32785014/12395601)
- [Top 4 Tactics To Keep Node.js Rockin’ in Docker](https://www.docker.com/blog/keep-nodejs-rockin-in-docker/)