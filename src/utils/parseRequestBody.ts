import type { IncomingMessage } from 'http';

export async function parseRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {resolve(body); });
    req.on('error', err => { reject(err); });
  });
}