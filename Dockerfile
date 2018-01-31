FROM node:8.9.3
LABEL maintainer "Angel Manzano Alcaraz <amalcaraz89@gmail.com>"

# Move to build dir
WORKDIR /usr/src/app

# Install app dependencies
ADD package*.json ./
RUN yarn install
RUN yarn cache clean --force

ENV NODE_ENV production

# Build the app
COPY . .
RUN yarn run build:ts

EXPOSE 80
EXPOSE 9229
ENTRYPOINT [ "./environment/entry.sh" ]
CMD ["prod"]