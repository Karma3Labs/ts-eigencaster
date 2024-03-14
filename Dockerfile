FROM node:16

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn

# Bundle app source
COPY . .
COPY .env.docker .env

RUN yarn build

EXPOSE 8080

CMD [ "yarn", "serve" ]
