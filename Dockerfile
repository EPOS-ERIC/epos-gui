FROM nginx:stable-alpine

ENV SERVER_NAME=_ \
    BASE_URL=/ \
    API_HOST=http://gateway:5000/api

COPY dist/ /opt/epos-gui/
COPY nginx.conf /etc/nginx/conf.d/default.conf

WORKDIR /opt/epos-gui/

CMD sed -Ei 's|<base href="[^"]*"[[:space:]]*/?>|<base href="'$BASE_URL'">|g' /opt/epos-gui/index.html && \
    sed -i 's|SERVER_NAME|'$SERVER_NAME'|g' /etc/nginx/conf.d/default.conf && \
    sed -i 's|BASE_URL|'$BASE_URL'|g' /etc/nginx/conf.d/default.conf && \
    sed -i 's|API_HOST|'$API_HOST'|g' /etc/nginx/conf.d/default.conf && \
    nginx -g "daemon off;"

EXPOSE 80
