FROM nginx:stable-alpine

ENV SERVER_NAME=_ \
    BASE_URL=/ \
    API_HOST=http://gateway:5000/api \
    AUTH_ROOT_URL=http://localhost:35000

COPY dist/ /opt/epos-gui/
COPY nginx.conf /etc/nginx/conf.d/default.conf

WORKDIR /opt/epos-gui/

CMD escaped_auth_root_url=$(printf '%s' "$AUTH_ROOT_URL" | sed 's/[&|]/\\&/g') && \
    find /opt/epos-gui -name '*.js' -exec sed -i "s|__AUTH_ROOT_URL__|$escaped_auth_root_url|g" {} \; && \
    sed -Ei 's|<base href="[^"]*"[[:space:]]*/?>|<base href="'$BASE_URL'">|g' /opt/epos-gui/index.html && \
    sed -i 's|SERVER_NAME|'$SERVER_NAME'|g' /etc/nginx/conf.d/default.conf && \
    sed -i 's|BASE_URL|'$BASE_URL'|g' /etc/nginx/conf.d/default.conf && \
    sed -i 's|API_HOST|'$API_HOST'|g' /etc/nginx/conf.d/default.conf && \
    nginx -g "daemon off;"

EXPOSE 80
