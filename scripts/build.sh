#!/bin/bash

react-scripts build && \
  find build -name "*.map" -exec rm {} \;
