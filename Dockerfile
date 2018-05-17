FROM node:alpine

# Create app directory
WORKDIR /usr/src/app
RUN apk update && apk add yarn
# Install app dependencies
COPY package.json ./
COPY yarn.lock ./

ENV NODE_ENV=production
RUN yarn install
# If you are building your code for production
# RUN npm install --only=production

RUN mkdir -p ./dist
# Bundle app source
RUN yarn build
COPY dist ./dist
RUN rm -rf node_modules
RUN yarn install --production

EXPOSE 7000
CMD [ "yarn", "start:server:prod" ]

