#!/bin/bash

VERSION=$(git rev-parse HEAD)

yarn run sentry-cli releases -p $SENTRY_PROJECT new $VERSION && \
  yarn run sentry-cli releases -p $SENTRY_PROJECT set-commits --auto $VERSION && \
  yarn run sentry-cli releases -p $SENTRY_PROJECT files $VERSION upload-sourcemaps --url-prefix https://$TARGET_HOSTNAME/static/js build/static/js && \
  yarn run sentry-cli releases -p $SENTRY_PROJECT deploys $VERSION new --env $TARGET_HOSTNAME
