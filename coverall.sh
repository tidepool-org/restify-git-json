#!/bin/bash

if [[ -f .cover_env ]] ; then
  # env
  env $(cat .cover_env) ./node_modules/.bin/coveralls
  # env $(cat .cover_env) ./node_modules/.bin/coveralls
  exit 0;
fi
./node_modules/.bin/coveralls

