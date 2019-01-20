'use strict';

import WebSocket from 'ws';
import LinkSession from './link-session'
import Debug from 'debug';

const debug = Debug('ws');
const debugData = Debug('ws-data');

export default class WebSocketServer {

  constructor(port) {
    this._wss = new WebSocket.Server({
      port: port
    });
    this._wss.on('connection', ws => {
      debug("[new client]");
      let session = new LinkSession(ws);
    });
  }

}
