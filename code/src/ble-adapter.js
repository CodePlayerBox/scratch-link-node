'use strict';

import noble from 'noble';
import EventEmitter from 'events';
import Debug from 'debug';

const debug = Debug('ble');
const debugData = Debug('ble-data');

class BLEAdapter extends EventEmitter {
  constructor() {
    super();

    // use peripheral to store the corresponding one
    this._peripherals = null;
    this._characteristics = null;
    this._pendingSubscribeUuids = null;
    this._deviceReady = false;

    noble.on('stateChange', this._stateChange.bind(this));
    noble.on('scanStart', this._scanStart.bind(this));
    noble.on('scanStop', this._scanStop.bind(this));
    noble.on('discover', this._discover.bind(this));
  }

  _stateChange(state) {
    debug('[stateChange]\n\t' + state);
    if (state === 'poweredOn') {
      this._deviceReady = true;
    }
  }

  _scanStart() {
    debug('[scanStart]');
  }

  _scanStop() {
    debug('[scanStop]');
  }

  _discover(peripheral) {
    debug('[discover]\n\t' + peripheral);
    this._peripherals[peripheral.id] = peripheral;
    this.emit('discover', peripheral);

    // we stop scanning when device are discovered
    this.stopScanning();
  }

  _discoverCharacteristics(peripheral) {
    //var serviceUuids = ["f005"];
    //var characterUuids = [
    //  "5261da01fa7e42ab850b7c80220097cc",
    //  "5261da02fa7e42ab850b7c80220097cc"];
    let characterUuids = [];

    debug(peripheral.advertisement.serviceUuids);

    peripheral.discoverServices(peripheral.advertisement.serviceUuids,
      (error, services) => {
        services.map(service => {
          service.discoverCharacteristics([], (error, characteristics) => {
            characteristics.map(c => {
              this._characteristics[c.uuid] = c;
              if (this._pendingSubscribeUuids.indexOf(c.uuid) >= 0) {
                // someone is pending to subscribe it
                this.subscribe(c.uuid);
              }
            });
          });
        });
      }
    );

  }

  _onCharacteristicData(data, isNotification) {
    debugData('[onCharacteristicData]\n\t' + data.toString('hex'));
    if (isNotification) {
      this.emit('notification', data);
    }
  }

  startScanning(serviceUuids) {
    debug('[request scanning]\n\t' + this._deviceReady);
    if (this._deviceReady) {
      // reset all status
      this._peripherals = {};
      this._characteristics = {};
      this._pendingSubscribeUuids = [];
      noble.startScanning(serviceUuids);
    }
  }

  stopScanning() {
    noble.stopScanning();
  }

  // connect the ble peripheral
  connect(id) {
    debug('[connect]\n\t' + id);
    let peripheral = this._peripherals[id];
    if (!peripheral) {
      return;
    }

    peripheral.once('connect', (err) => {
      this._discoverCharacteristics(peripheral);
    });

    peripheral.once('disconnect', () => {
      debug('[disconnect event]');
    });

    peripheral.connect(err => {
      debug('[connected]\n\t' + err);
    });
  }

  disconnect(id) {
    debug('[disconnect]\n\t' + id);
    let peripheral = this._peripherals[id];
    if (!peripheral) {
      return;
    }

    peripheral.disconnect(err => {
      debug('[disconnected]\n\t' + err);
    });
  }

  subscribe(characteristicUuid) {
    let characteristic = this._characteristics[characteristicUuid];
    if (characteristic) {
      if (characteristic.properties.indexOf('notify') >= 0) {
        debug('[subscribe]\n\t' + characteristic);
        characteristic.on('data', this._onCharacteristicData.bind(this));
        characteristic.subscribe(function(error) {
          //TODO: how to send back the error message
          //callback(error, "", "", null);
        });
      }
      let index = this._pendingSubscribeUuids.indexOf(characteristicUuid);
      if (index >= 0) {
        this._pendingSubscribeUuids.splice(index, 1);
      }
    } else {
      // push the characteristic uuid as pending one
      this._pendingSubscribeUuids.push(characteristicUuid);
    }
  }

  write(characteristicUuid, data, callback) {
    let characteristic = this._characteristics[characteristicUuid];
    if (characteristic) {
      characteristic.write(data, true, callback);
    }
  }

}

export default new BLEAdapter();
