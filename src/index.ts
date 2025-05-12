import {createServer, request} from 'http';
import dotenv from 'dotenv';
import cluster from 'cluster';
import os from 'os';
import { serverResponseUtil } from './utils/serverResponse';
import serverHandler from './serverHandler/serverHandler';

dotenv.config();
export const PORT = Number(process.env.PORT) || 4000;

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

const numCPUs = os.availableParallelism?.() || os.cpus().length;
const WORKERS = numCPUs - 1;

if (cluster.isPrimary) {
  const workers = [];

  for (let i = 1; i <= WORKERS; i++) {
    const worker = cluster.fork({ PORT: PORT + i });
    workers.push(worker);
  }

  let current = 0;

  const loadBalancer = createServer((req, res) => {
    const workerPort = PORT + 1 + (current % WORKERS);
    current++;

    const options = {
      hostname: 'localhost',
      port: workerPort,
      path: req.url,
      method: req.method,
      headers: req.headers,
    };

    createServer();
    const proxyReq = request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    req.pipe(proxyReq, { end: true });
    console.log('proxy worker: ', workerPort);

    proxyReq.on('error', (err) => {
      console.error(`Proxy error: ${err}`);
      serverResponseUtil(res, 500, JSON.stringify({message: 'Internal server error'}));
    });
  });

  loadBalancer.listen(PORT, () => {
    console.log(`Load balancer is listening on http://localhost:${PORT}`);
  });
} else {
    const server = createServer(serverHandler);
const workerPort = Number(process.env.PORT);
server.listen(workerPort, () => {
    console.log(`Worker ${process.pid} listening on port ${PORT}`);
  });
}
