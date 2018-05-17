#!/bin/bash
# strict mode http://redsymbol.net/articles/unofficial-bash-strict-mode/
set -euo pipefail
IFS=$'\n\t'

command -v yarn >/dev/null 2>&1 || { npm i -g yarn@1.6; }
yarn
yarn build
docker build -t joeybaker/still-there .

