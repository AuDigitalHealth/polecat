#!/bin/bash

aws s3 sync build s3://johngrimes-polecat --delete \
  --cache-control "max-age=0" --storage-class REDUCED_REDUNDANCY \
  --exclude "static/*"

aws s3 sync build/static s3://johngrimes-polecat/static --delete \
  --cache-control "public, max-age=31536000 " --storage-class REDUCED_REDUNDANCY \
  --exclude "*.map"
