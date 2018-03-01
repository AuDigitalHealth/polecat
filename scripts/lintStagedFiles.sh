#!/bin/bash

STAGED=$(git diff --name-only --cached --diff-filter=AM | egrep '^(.*).js$')

yarn eslint --max-warnings 0 --no-ignore $STAGED
