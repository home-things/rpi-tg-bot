#!/usr/bin/env bash
find . -name '*.js' \
  -not -path "./node_modules/*" \
  -not -path "./.history/*" \
  -not -name "*test*" \
  | while read f; do echo $f; node -c $f; done
