FROM node:alpine

# Create app directory
WORKDIR /usr/src/app
RUN npm i -g yarn@1.6
# Install app dependencies
COPY package.json ./
COPY yarn.lock ./

ENV NODE_ENV=production
RUN yarn --production --prefer-offline
# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
COPY dist .

EXPOSE 7000
CMD [ "yarn", "start:server:prod" ]

