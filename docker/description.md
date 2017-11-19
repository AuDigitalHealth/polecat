# Polecat

A tool for browsing the Australian Medicines Terminology (AMT), using data from
an instance of [Medserve](http://medserve.online).

# Configuration

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

##### Example Docker Compose file

```
version: "3"

services:
  polecat:
    image: johngrimes/polecat
    ports:
      - "80:80"
    volumes:
      - "./config.js:/usr/share/nginx/html/config.js"
```
