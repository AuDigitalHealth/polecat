#!/bin/bash

react-scripts build
cp -R build release
find release -name "*.map" -exec rm {} \;
rm -f release/config.json
docker build -t $DOCKER_IMAGE --build-arg version=$(git rev-parse HEAD) .
rm -rf release
