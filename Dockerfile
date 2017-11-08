FROM nginx

COPY dockify/polecat.nginx.conf /etc/nginx/conf.d/default.conf
COPY build /usr/share/nginx/html
