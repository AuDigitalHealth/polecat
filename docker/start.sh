#!/bin/bash

CONF=/etc/nginx/conf.d

envsubst '\$POLECAT_FHIR_SERVER \$POLECAT_VERSION \$POLECAT_SENTRY_DSN' \
  < $CONF/default.conf > $CONF/default.subst.conf && \
  cp $CONF/default.subst.conf $CONF/default.conf && \
  rm $CONF/default.subst.conf && \
  exec nginx -g 'daemon off;'
