FROM balenalib/raspberry-pi-alpine-node:8
MAINTAINER Wenpeng Xiao <xiaowp@flamingoeda.com>

# Install packages.
#RUN apk update && \
#  apk add --no-cache bluez

# Clean up when done.
#RUN rm -rf /tmp/* /var/cache/apk/* /var/tmp/*

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app
COPY code/dist .
COPY code/cert cert

# Initialize script when container start.
COPY ./docker-entrypoint.sh /
COPY ./start_all.sh /usr/bin/start_all
RUN chmod a+x /docker-entrypoint.sh && chmod a+x /usr/bin/start_all
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["start_all"]
