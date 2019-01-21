import https from 'https';
import express from 'express';
import {create, Cert} from "selfsigned-ca";
import proxy from "http-proxy-middleware";
import Debug from "debug";

const debug = Debug('app');

var webApp = express();
var wsProxy = proxy({
  target: 'ws://localhost:20190/scratch/ble',
  ws: true,
  changeOrigin:true,
  logLevel: 'debug'
});
webApp.use('/', wsProxy);

function createHttpsServer(devCert) {
  var server = https.createServer(devCert, webApp);
  server.listen(20110);
  server.on('upgrade', wsProxy.upgrade);
}

async function loadCerts() {
  var devCert = new Cert('codeplayerbox.device-manager');

  try {
    debug('loading existing dev certificate');
    await devCert.load();
    debug('loaded dev cert');
  } catch(err) {
    debug('loading dev cert failed');
    debug(err);
  }

  return devCert;
}

loadCerts()
  .then(createHttpsServer)
  .then(() => debug('certificates ready, server listening'))
  .catch(console.error)


