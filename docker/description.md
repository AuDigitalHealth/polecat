# Polecat

A tool for browsing the Australian Medicines Terminology (AMT), using data from
an instance of [Medserve](https://medserve.online).

# Configuration

Polecat is configured using the following environment variables, which can be
passed using the `environment` key within a Docker Compose file:

* `POLECAT_FHIR_SERVER`: the FHIR endpoint of the Medserve instance.
* `POLECAT_VERSION`: the version of the application, which is used when
  reporting to Sentry. This is automatically set during the build (to the Git
  SHA), so does not
* `POLECAT_SENTRY_DSN`: the string used to identify the application to Sentry.
* `POLECAT_GOOGLE_ANALYTICS_TRACKING_ID`: tracking ID for sending analytics data
  to a Google Analytics account.

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
      POLECAT_SENTRY_DSN: https://XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX@sentry.io/XXXXXX
      POLECAT_GOOGLE_ANALYTICS_TRACKING_ID: UA-XXXXXXXXX-X
```
