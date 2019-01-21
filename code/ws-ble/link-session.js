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
    this._ws = ws;
    this._ble = BLEAdapter;
    this._peripheralId = null;

    this.jaysonServer = Jayson.server({
      'discover': this._discoverMethod.bind(this),
      'read': this._readMethod.bind(this) ,
      'write': this._writeMethod.bind(this) ,
      'connect': this._connectMethod.bind(this)

    });

    this._ws.on('message', this._onWSMessage.bind(this));
    this._ws.on('close', this._onWSClose.bind(this));

    this._ble.on('discover', this._onBLEDiscover.bind(this));
    this._ble.on('notification', this._onBLENotification.bind(this));
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
    this._ble.startScanning(serviceUuids);
    callback(null, null);
  }

  _readMethod(args, callback) {
    debug('=> read');
    if (args.startNotifications) {
      let serviceUuid = args.serviceId.toString(16);
      let characteristicUuid = args.characteristicId.replace(/-/g, '');
      this._ble.subscribe(characteristicUuid);
    }
    callback(null, null);
  }

  _writeMethod(args, callback) {
    debug('=> write');
    let serviceUuid = args.serviceId.toString(16);
    let characteristicUuid = args.characteristicId.replace(/-/g, '');
    let data = Buffer.from(args.message, args.encoding);
    this._ble.write(characteristicUuid, data, err => {
      if (args.withResponse) {
        // TODO: we need return response
      }
    });
    callback(null, null);
  }

  _connectMethod(args, callback) {
    debug('=> connect');
    this._peripheralId = args.peripheralId;
    this._ble.connect(args.peripheralId);
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
    debug("=> close");
    this._ws = null;
    this._ble.disconnect(this._peripheralId);
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
            this._ws.send(body);
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
    if(this._ws) {
      try {
        this._ws.send(JSON.stringify(request));
      } catch (e) {
        // we ignore it
        debug("== error\n\t" + e);
      }
    }
  }

}
