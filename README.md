# Polecat

A tool for browsing the Australian Medicines Terminology (AMT), using data from
an instance of [Medserve](https://medserve.online).

## Features

* Provides a full-text search facility for locating medicine concepts within
  AMT.
* Supports searching of CTPP, TPP, TPUU, TP, MPP, MPUU, MP and substance
  concepts. Concept types are displayed alongside search results.
* Selecting a concept renders an object diagram, showing its details along with
  its relationship to other concepts, in a manner which is faithful to the AMT
  Product Model.
* Relationship types are rendered differently depending on whether they have
  inheritance, association or aggregation semantics.
* ARTG IDs are shown against applicable concepts, along with a link to the
  relevant page on the TGA web site.
* Re-focus on a related concept by clicking its SCT ID.
* Copy an SCT ID or preferred term to the clipboard by clicking the clipboard
  icon adjacent.
* Where child concepts or related packages are shown in large numbers, these are
  grouped with a link to the full listing.
* The AMT Product Model view can be panned around by clicking and dragging,
  using scroll wheels or a trackpad. The view can be re-centred by
  double-clicking.
* Control visibility of each type of concept. Settings are remembered once set.
* Perform an advanced search, using the following fields:
  * Contains text - returns concepts which contain the supplied text within the
    preferred term.
  * Ingredient - returns concepts which have ingredients that match the supplied
    concept ID or text.
  * Package item - returns packages (MPP, TPP or CTPP) that contain concepts
    which match the supplied MPUU or TPUU concept or text.
  * Form - returns concepts which have a form which matches the supplied text
    (e.g. tablet).
  * Container - returns concepts which have a container which matches the
    supplied text (e.g. bottle).
  * Brand - returns concepts which have a brand (TP) which matches the supplied
    text (e.g. Voltaren).
  * PBS code - returns concepts which are mapped to a [PBS](https://pbs.gov.au/)
    item code.
  * ARTG ID - returns concepts which are mapped to a product listed on the
    [Australian Register of Therapeutic Goods](https://www.tga.gov.au/australian-register-therapeutic-goods).
  * Parent - Returns concepts which are descendants of concepts that match the
    supplied text or concept ID.
  * Type - Narrow the search to only include a subset of concept types, i.e.
    CTPP, TPP, TPUU, MPP, MPUU or MP.
  * Status - Narrow the search to include only concepts with one of the selected
    statuses, i.e. Active, Inactive or Entered in Error.
* Download the results of an advanced search in TSV (tab-separated values)
  format.
* Can be configured to point to any Medserve instance, see
  [Configuration](#configuration).
* Can be configured to report errors to [Sentry](https://sentry.io).

## Development dependencies

Polecat only has two development dependencies:

* [Node.js](https://nodejs.org/)
* [Yarn](https://yarnpkg.com/)

## Common tasks

##### Start a development server on port 3000

```
yarn start
```

##### Run unit tests and monitor changes

```
yarn test
```

##### Start a Storybook server on port 9009

[Storybook](https://storybook.js.org/) is an environment for developing and
testing the components within Polecat in isolation from one another.

```
yarn storybook
```

##### Update test files

There are a set of files in the `test` directory that serve as fixtures for the
unit tests and stories. These were taken from actual responses from Medserve,
and can be refreshed by using the following command:

```
yarn update-test-files
```

##### Run the linter

```
yarn lint
```

##### Build a release

This will output a set of production-optimised static files in the build
directory.

```
yarn build
```

##### Build the Docker image

This will package the build into a [Docker](https://www.docker.com/) image,
ready for deployment.

```
yarn dockerize
```

This script requires you to set the `DOCKER_IMAGE` environment variable, which
controls the name which is used to tag the image.

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

## Deployment requirements

* Polecat must be served via HTTPS. This is because it relies on APIs within the
  browser which are not enabled in insecure contexts.
* Polecat must communicate to Medserve via HTTPS. This is because browser
  security policy will not allow a secure page to make requests to a server over
  plain HTTP.
* Polecat currently only supports deployment at the server root. For example,
  https://browse.medserve.online would be ok, while
  https://medserve.online/browse would not be supported.
