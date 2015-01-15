# Dockerfile for a standard freedom-for-node instance

FROM selenium/node-node
MAINTAINER Will Scott <willscott@gmail.com>

USER root

RUN apt-get update -qqy \
  && apt-get -qqy install \
    nodejs nodejs-legacy git npm 

RUN npm install -g grunt-cli
ADD . /freedom-for-node
WORKDIR /freedom-for-node

RUN npm install

ENV DISPLAY :10

ENTRYPOINT ["/freedom-for-node/tools/docker-entrypoint.sh"]
