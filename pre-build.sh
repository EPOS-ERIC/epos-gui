#!/bin/sh -e
short_sha=$(git log --pretty=format:%h -n 1)
commit_date=$(git log -1 --format=%cd)
git_tag=$(git describe --tags --exact-match 2>/dev/null || git describe --tags --always --dirty=+)
escaped_git_tag=$(printf '%s\n' "$git_tag" | sed 's/[&/]/\\&/g')

sed -i -e "s/GITHASH/$short_sha/g" src/environments/environmentBase.ts
sed -i -e "s/COMMIT_DATE/$commit_date/g" src/environments/environmentBase.ts
sed -i -e "s/GIT_TAG/$escaped_git_tag/g" src/environments/environmentBase.ts
