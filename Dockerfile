FROM node:latest

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

RUN yarn

COPY . .

RUN yarn build

ENTRYPOINT [ "node", "bin" ]