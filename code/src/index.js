'use strict';

import WebSocketServer from './ws-server';
import BLEAdapter from './ble-adapter'
import Debug from 'debug';

const debug = Debug('app');
const debugData = Debug('app-data');

const server = new WebSocketServer(20110);
