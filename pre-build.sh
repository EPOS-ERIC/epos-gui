#!/bin/sh -e
export SHORT_SHA=`git log --pretty=format:%h -n 1`
sed -i -e s/GITHASH/$SHORT_SHA/g src/environments/environmentBase.ts
commit_date=$(git log -1 --format=%cd)
sed -i -e "s/COMMIT_DATE/$commit_date/g" src/environments/environmentBase.ts
sed -i -e "s|EPOS_SITE_API_REST_URL|$EPOS_SITE_API_REST_URL|g" src/environments/environmentBase.ts
sed -i -e "s/EPOS_SITE_API_REST_KEY/$EPOS_SITE_API_REST_KEY/g" src/environments/environmentBase.ts
sed -i -e "s/EPOS_ESRI_API_KEY/$EPOS_ESRI_API_KEY/g" src/environments/environmentBase.ts
sed -i -e "s/EPOS_SHARE_SALT/$EPOS_SHARE_SALT/g" src/environments/environmentBase.ts

# Define ENV urls
sed -i -e "s|EPOS_ENV_PROD_URL|$EPOS_ENV_PROD_URL|g" src/environments/environment.ts
sed -i -e "s|EPOS_ENV_STAGE_URL|$EPOS_ENV_STAGE_URL|g" src/environments/environment.ts
sed -i -e "s|EPOS_ENV_LATEST_URL|$EPOS_ENV_LATEST_URL|g" src/environments/environment.ts

# Matomo endpoints Production
sed -i -e "s|EPOS_PROD_MATOMO_ENDPOINT|$EPOS_PROD_MATOMO_ENDPOINT|g" src/environments/environment.prod.ts
sed -i -e "s/EPOS_PROD_MATOMO_SITE_ID/$EPOS_PROD_MATOMO_SITE_ID/g" src/environments/environment.prod.ts
# Matomo Token Auth Production
sed -i -e "s|EPOS_PROD_MATOMO_TOKEN_AUTH|$EPOS_PROD_MATOMO_TOKEN_AUTH|g" src/environments/environment.prod.ts


if [ -d node_modules ]
then
  echo 'node_modules exists'
else
  if [ -d /opt/epos-gui/node_modules ]
  then
    echo 'reusing (copying) node_modules from the master docker image'
    mv /opt/epos-gui/node_modules .
  fi
fi

# upgrade node version
npm install -g n
n 16.17

# Install dependancies
npm install
