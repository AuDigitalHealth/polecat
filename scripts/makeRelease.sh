#!/bin/bash

cp -R build release
find release -name "*.map" -exec rm {} \;
