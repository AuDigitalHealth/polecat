FROM nginx
ARG version

COPY docker/start.sh /usr/local/bin
RUN chmod +x /usr/local/bin/start.sh

COPY docker/polecat.nginx.conf /etc/nginx/conf.d/default.conf
COPY build /usr/share/nginx/html
COPY docker/config-ssi.json /usr/share/nginx/html/config.json

ENV POLECAT_FHIR_SERVER=https://medserve.online/fhir
ENV POLECAT_VERSION=$version

CMD ["/usr/local/bin/start.sh"]
