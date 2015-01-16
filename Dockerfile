# Dockerfile for a standard freedom-for-node instance 

FROM google/nodejs
MAINTAINER lalon Aziz <klazizpro@gmail.com>

USER root
RUN apt-get update -qqy \
  && apt-get -qqy install \
  	nodejs-legacy git npm 

ADD . /freedom-for-node 
WORKDIR /freedom-for-node

RUN npm install 
ENV DISPLAY :10

ENTRYPOINT ["/freedom-for-node/tools/docker-entrypoint.sh"]  
