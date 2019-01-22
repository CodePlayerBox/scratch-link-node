#!/bin/sh

### Start websocket ble server
DEBUG=app,ble,ws,link node ws-ble.js &

### Start device manager
DEBUG=app node device-manager.js

### Never stop it
while :
do
  sleep 60
done
