#!/bin/bash

now -n polecat -t $NOW_TOKEN alias set `now --npm -n polecat -t $NOW_TOKEN` $TARGET_HOSTNAME
