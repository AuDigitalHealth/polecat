#!/bin/bash

yarn run sentry-cli releases -p $SENTRY_PROJECT new `git rev-parse HEAD` && \
  yarn run sentry-cli releases -p $SENTRY_PROJECT files `git rev-parse HEAD` upload-sourcemaps --url-prefix https://$TARGET_HOSTNAME/static/js build/static/js
