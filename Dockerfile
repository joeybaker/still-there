FROM node:alpine

# Create app directory
WORKDIR /usr/src/app
RUN apk update && apk add yarn
# Install app dependencies
COPY package.json ./
COPY yarn.lock ./

ENV NODE_ENV=production
RUN yarn --production
# If you are building your code for production
# RUN npm install --only=production

RUN mkdir -p ./dist
# Bundle app source
COPY dist ./dist

EXPOSE 7000
CMD [ "yarn", "start:server:prod" ]

