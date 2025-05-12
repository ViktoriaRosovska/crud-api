import {createServer} from 'http';
import dotenv from 'dotenv';

import serverHandler from './serverHandler/serverHandler';

dotenv.config();
export const PORT = Number(process.env.PORT) || 4000;

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

const server = createServer(serverHandler);
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });

  process.on('SIGINT', () => {
    console.log('Gracefully shutting down...');
    server.close(() => {
      console.log('Closed all connections');
      process.exit(0);
    });
  });
