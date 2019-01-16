'use strict';

import EventEmitter from 'events';
import WebSocket from 'ws';
import Jayson from 'jayson';
import Debug from 'debug';
import BLEAdapter from './ble-adapter'

const debug = Debug('link');
const debugData = Debug('link-data');
const utils = Jayson.Utils;

export default class LinkSession {

  constructor(ws) {
    this.ws = ws;
    this.ble = BLEAdapter;
    this.peripheralId = null;
    this.sid = Math.random();

    this.jaysonServer = Jayson.server({
      'discover': this._discoverMethod.bind(this),
      'read': this._readMethod.bind(this) ,
      'write': this._writeMethod.bind(this) ,
      'connect': this._connectMethod.bind(this)

    });

    this.ws.on('message', this._onWSMessage.bind(this));
    this.ws.on('close', this._onWSClose.bind(this));

    this.ble.on('discover', this._onBLEDiscover.bind(this));
    this.ble.on('notification', this._onBLENotification.bind(this));
  }

  _discoverMethod(args, callback) {
    debug('=> discover');

    let serviceUuids = [];
    args.filters.map(filter => {
      if (filter.services) {
        filter.services.map(uuid => {
          serviceUuids.push(uuid.toString(16));
        });
      }
    });
    this.ble.startScanning(serviceUuids);
    callback(null, null);
  }

  _readMethod(args, callback) {
    debug('=> read');
    if (args.startNotifications) {
      let serviceUuid = args.serviceId.toString(16);
      let characteristicUuid = args.characteristicId.replace(/-/g, '');
      this.ble.subscribe(characteristicUuid);
    }
    callback(null, null);
  }

  _writeMethod(args, callback) {
    debug('=> write');
    let serviceUuid = args.serviceId.toString(16);
    let characteristicUuid = args.characteristicId.replace(/-/g, '');
    let data = Buffer.from(args.message, args.encoding);
    this.ble.write(characteristicUuid, data, err => {
      if (args.withResponse) {
        // TODO: we need return response
      }
    });
    callback(null, null);
  }

  _connectMethod(args, callback) {
    debug('=> connect');
    this.peripheralId = args.peripheralId;
    this.ble.connect(args.peripheralId);
    callback(null, null);
  }

  _onBLEDiscover(peripheral) {
    this.notify('didDiscoverPeripheral', {
      peripheralId: peripheral.id,
      name: peripheral.advertisement.localName,
      rssi: peripheral.rssi
    });
  }

  _onBLENotification(data) {
    debugData('<= notification\n\t' + data.toString('hex'));
    this.notify('characteristicDidChange', {
      message:  data ? data.toString('base64') : ""
    });
  }

  _onWSClose() {
    debug("=> close\n\t" + this.sid);
    this.ws = null;
    this.ble.disconnect(this.peripheralId);
  }

  // initialize the websocket client
  _onWSMessage(message) {
    debug("=> message\n\t" + message);

    let options = {};
    utils.JSON.parse(message, options, ((err, request) => {
      this._respondError(err);
      if (err) {
        return this._respondError(err);
      }

      this.jaysonServer.call(request, ((error, success) => {
        let response = error || success;
        //console.log("response");
        //console.log(response);
        if (response) {
          utils.JSON.stringify(response, options, ((err, body) => {
            if (err) {
              return this._respondError(err);
            }
            this.ws.send(body);
          }).bind(this));
        } else {
          // no response received at all, must be a notification
        }
      }).bind(this)); // end server call

    }).bind(this)); // end parse message
  }

  _respondError(err) {
    // TODO: response error
  }

  notify(method, args) {
    var request = utils.request(method, args, undefined, {
      generator: utils.generateId,
      version: 2
    });
    delete(request.id); // TODO:

    debugData("<= notify\n\t" + JSON.stringify(request));

    // trigger event
    if(this.ws) {
      try {
        this.ws.send(JSON.stringify(request));
      } catch (e) {
        // we ignore it
        debug("== error\n\t" + e);
      }
    }
  }

}
