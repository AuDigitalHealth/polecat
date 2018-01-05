# Polecat

A tool for browsing the Australian Medicines Terminology (AMT), using data from
an instance of [Medserve](http://medserve.online).

# Configuration

Polecat is configured using the following environment variables, which can be
passed using the `environment` key within a Docker Compose file:

* `POLECAT_FHIR_SERVER`: the FHIR endpoint of the Medserve instance.
* `POLECAT_VERSION`: the version of the application, which is used when
  reporting to Sentry.
* `POLECAT_SENTRY_DSN`: the string used to identify the application to Sentry.

##### Example Docker Compose file

```
version: "3"

services:
  polecat:
    image: johngrimes/polecat
    ports:
      - "80:80"
    environment:
      POLECAT_FHIR_SERVER: https://medserve.online/fhir
      POLECAT_VERSION: d025c2b579571b9bccddcac86f7105e554ebff34
      POLECAT_SENTRY_DSN: https://437424b3205e41818fae4bff9663738c@sentry.io/257411
```
