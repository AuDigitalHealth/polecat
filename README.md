# Polecat

A tool for browsing the Australian Medicines Terminology (AMT), using data from
an instance of [Medserve](http://medserve.online).

## Features

- Provides a full-text search facility for locating medicine concepts within
  AMT.
- Supports searching of CTPP, TPP, TPUU, TP, MPP, MPUU, MP and substance
  concepts.
  Concept types are displayed alongside search results.
- Selecting a concept renders an object diagram, showing its details along with
  its relationship to other concepts, in a manner which is faithful to the AMT
  Product Model.
- Relationship types are rendered differently depending on whether they have
  inheritance, association or aggregation semantics.
- ARTG IDs are shown against applicable concepts, along with a link to the
  relevant page on the TGA web site.
- Re-focus on a related concept by clicking its SCT ID.
- Copy an SCT ID or preferred term to the clipboard by clicking the clipboard
  icon adjacent.
- Where child concepts or related packages are shown in large numbers, these
  are grouped with a link to the full listing. (NOTE: The full listing has not
  been implemented yet, see the Backlog (LINK NEEDED))
- The AMT Product Model view can be panned around by clicking and dragging,
  using scroll wheels or a trackpad. The view can be re-centred by
  double-clicking.
- Can be configured to point to any Medserve instance, see Configuration (LINK NEEDED).

## Development dependencies

Polecat only has two development dependencies:

- [Node.js](https://nodejs.org/)
- [Yarn](https://yarnpkg.com/)

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

##### Build a deployable release

This will output a set of static files in the build directory.

```
yarn build
```

##### Build the Docker image

Polecat can also be packaged up as a [Docker](https://www.docker.com/) image.

```
yarn build-docker
```

## Configuration

Polecat is configured using a file called `config.js`, which it expects to be
served from the root of its deployment location.

The available configuration parameters are:

- `fhirVersion`: the FHIR endpoint of the Medserve instance.

##### Example configuration

```
{
  "fhirServer": "https://medserve.online/fhir"
}
```

## Deployment requirements

- The web server must be configured to serve files that exist within the
  distribution, or return `index.html` with a `200 OK` for files which aren't
  found.
- Polecat must be served via HTTPS. This is because it relies on APIs within the
  browser which are not enabled in insecure contexts.
- Polecat must communicate to Medserve via HTTPS. This is because browser
  security policy will not allow a secure page to make requests to a server
  over plain HTTP.
