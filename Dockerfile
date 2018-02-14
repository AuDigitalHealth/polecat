FROM nginx
ARG version

COPY docker/start.sh /
COPY docker/buildConfig.sh /
RUN chmod +x /start.sh /buildConfig.sh

COPY docker/polecat.nginx.conf /etc/nginx/conf.d/default.conf
COPY build /usr/share/nginx/html

ENV POLECAT_FHIR_SERVER=https://medserve.online/fhir
ENV POLECAT_VERSION=$version

CMD ["/start.sh"]
