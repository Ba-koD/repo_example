FROM nginx:1.27-alpine

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY public/ /usr/share/nginx/html/
COPY docker-entrypoint.d/30-render-config.sh /docker-entrypoint.d/30-render-config.sh

RUN chmod +x /docker-entrypoint.d/30-render-config.sh

EXPOSE 80

