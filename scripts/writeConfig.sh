#!/bin/bash

echo "{ \"fhirServer\": \"$FHIR_SERVER\", \"version\": \"`git rev-parse HEAD`\", \"sentryDsn\": \"$SENTRY_DSN\" }" > public/config.json
cat public/config.json
