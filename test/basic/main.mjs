import { WebSocketServer } from 'ws';

import {
  serveFile,
  serveFolder,
  Server,
  serveWebSocket,
} from '../../src/main.mjs';

import { INSTANCES } from './server_config.mjs';

const wsServer = new WebSocketServer({ noServer: true });

wsServer.on('connection', ws => {
  ws.on('message', msg => {
    ws.send(`recv ${new Date().toISOString()}; ${msg}`);
  });
});

const server = new Server({
  instances: INSTANCES,
  requestListener: async clientRequest => {
    console.log(
      `[${new Date().toISOString()}] ${clientRequest.listenerID} ${clientRequest.ipFamily} [${clientRequest.remoteAddress}]:${clientRequest.remotePort} ${clientRequest.headers[':method']} /${clientRequest.path}`
    );
    
    if (clientRequest.pathIsHostname) {
      clientRequest.respond('Error: connect requests unsupported', { ':status': 405 });
      return;
    }
    
    if (clientRequest.pathMatch('files/')) {
      await serveFolder({
        clientRequest: clientRequest.subRequest('files/'),
        fsPathPrefix: 'files',
      });
    } else if (clientRequest.path == 'ws') {
      serveWebSocket({
        clientRequest,
        wsServer,
      });
    } else if (clientRequest.path == 'file.txt') {
      clientRequest.respond(`plain text ${new Date().toISOString()}`);
    } else if (clientRequest.path == '') {
      await serveFile({
        clientRequest,
        fsPath: 'index.html',
      });
    } else {
      clientRequest.respond('Error: path not found', { ':status': 404 });
    }
  },
});

await server.listen();

console.log('Server active');
