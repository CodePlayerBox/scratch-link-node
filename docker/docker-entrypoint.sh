#!/bin/bash
set -e

if [ "$1" = 'start_all' ]; then
    exec /usr/bin/start_all
fi

exec "$@"
