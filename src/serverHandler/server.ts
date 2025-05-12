import { createServer } from 'http';
import serverHandler from './serverHandler';

export const server = createServer(serverHandler);