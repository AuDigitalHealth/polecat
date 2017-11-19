FROM nginx

COPY docker/polecat.nginx.conf /etc/nginx/conf.d/default.conf
COPY build /usr/share/nginx/html
