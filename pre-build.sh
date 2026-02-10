#!/bin/sh -e
export SHORT_SHA=`git log --pretty=format:%h -n 1`
commit_date=$(git log -1 --format=%cd)

sed -i -e s/GITHASH/$SHORT_SHA/g src/environments/environmentBase.ts
sed -i -e "s/COMMIT_DATE/$commit_date/g" src/environments/environmentBase.ts
