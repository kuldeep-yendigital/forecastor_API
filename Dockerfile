FROM node:8.9.1-alpine
MAINTAINER Informa plc <info@informa.com>

ENV APP_PATH /var/www/forecaster-api

RUN apk add --update bash && \
    apk add --update git && \
    apk add --update g++ && \
    apk add --update make && \
    apk add --update python2 && \
    rm -rf /var/cache/apk/*

# Create app directory
RUN mkdir -p $APP_PATH
WORKDIR $APP_PATH

# Install app dependencies
COPY package.json $APP_PATH
COPY package-lock.json $APP_PATH
RUN npm install -dd

# Bundle app source
COPY . $APP_PATH

CMD ["npm", "run", "start"]
