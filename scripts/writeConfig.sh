#!/bin/bash

echo "{ \"fhirServer\": \"$FHIR_SERVER\", \"version\": \"`git rev-parse HEAD`\" }" > public/config.json
cat public/config.json
