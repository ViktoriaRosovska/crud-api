import {createServer, request} from 'http';
import dotenv from 'dotenv';
import { v4 as uuidv4, validate } from 'uuid';
import cluster from 'cluster';
import os from 'os';
import type { User} from "./types/type"
import { crudDB } from './db/crud-db';
import { serverResponseUtil } from './utils/serverResponse';
import { parseRequestBody } from './utils/parseRequestBody';

dotenv.config();
const PORT = Number(process.env.PORT) || 4000;

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
    console.log('proxy worker', workerPort);

    proxyReq.on('error', (err) => {
      console.error(`Proxy error: ${err}`);
      serverResponseUtil(res, 500, JSON.stringify({message: 'Internal server error'}));
    });
  });

  loadBalancer.listen(PORT, () => {
    console.log(`Load balancer is listening on http://localhost:${PORT}`);
  });
} else {
    const server = createServer(async (req, res) => {
    try {
        const url = req.url;
        const method = req.method;
        const userId = url?.split('/')[3];
        if (url?.startsWith('/api/users')) {
            const contentType = req.headers['content-type'];
            if (contentType !== 'application/json') {
                return serverResponseUtil(res, 400, JSON.stringify({ message: 'Content-Type must be application/json' }))
            }
            switch (method) {
                case 'GET': {
                    if (userId) {
                        if (!validate(userId)) return serverResponseUtil(res, 404, JSON.stringify({ message: 'Route Not Found' }))
                        const user = crudDB.find((user: User) => user.id === userId);

                    if (!user) {
                        return serverResponseUtil(res, 404, JSON.stringify({ message: 'User not found' })); 
                    }
                    console.log(`Worker 1 ${process.pid} listening on port ${PORT}`);
                    return serverResponseUtil(res, 200, JSON.stringify(user));
                    
                    } else {
                        return   serverResponseUtil(res, 200, JSON.stringify(crudDB));
                       
                    };
                break;
                } 
                case 'POST': {
                    try {
                        const body = await parseRequestBody(req);
                        const data = JSON.parse(body);
                        if (res.writableEnded) return;
                    
                        if (!data.username || !data.age || !Array.isArray(data.hobbies) || !data.hobbies.every((h: string) => typeof h === 'string')) {
                            serverResponseUtil(res, 400, JSON.stringify({message: 'Invalid user data'}));
                            return;
                        }
                        const newUser: User = {
                            id: uuidv4(),
                            username: data.username,
                            age: data.age,
                            hobbies: data.hobbies
                        }
                        crudDB.push(newUser);
                        serverResponseUtil(res, 201, JSON.stringify(newUser))
                        return;
                    } catch (error) {
                        return serverResponseUtil(res, 400, JSON.stringify({ message: 'Invalid JSON' }));
                   
                    }
                break;
                }
                case 'PUT': { 
                    if (!validate(userId!)) {
                        return  serverResponseUtil(res, 400, JSON.stringify( {message: 'Invalid UUID'}));     
                    }
                    try {
                    const body = await parseRequestBody(req);
                    const data = JSON.parse(body); 
                    
                    let findUser = crudDB.find((user: User) => userId === user.id);
                    if (!findUser) {
                        return  serverResponseUtil(res, 404, JSON.stringify( {message: 'User not found'}));    
                    }
                    if (!data.username || !data.age || !Array.isArray(data.hobbies) || !data.hobbies.every((h: string) => typeof h === 'string')) {
                        return serverResponseUtil(res, 400, JSON.stringify({message: 'Invalid user data'}));
                    }
                        const index = crudDB.indexOf(findUser);
                        const updateUser = {...crudDB[index], ...data};
                        crudDB[index] = {...updateUser};
                        return serverResponseUtil(res, 200, JSON.stringify(updateUser));      
                    } catch (error) {              
                        return serverResponseUtil(res, 400, JSON.stringify({ message: 'Invalid JSON' }));  
                    }
                    break;
                }
                case 'DELETE': {
                    try {
                        if (!validate(userId!)) {
                            return serverResponseUtil(res, 400, 'Invalid UUID')
                            
                        }
                        const index = crudDB.findIndex((user: User) => user.id === userId);
                        if (index === -1) {
                            return serverResponseUtil(res, 404, JSON.stringify({ message: 'User not found' }))
                                
                            }
                        crudDB.splice(index, 1); 
                        return serverResponseUtil(res, 204, '');
                        
                    } catch (error) {
                        return serverResponseUtil(res, 400, JSON.stringify({ message: 'Invalid JSON' }));
                    }
                    break;
                }
                default: {
                    return  serverResponseUtil(res, 405, JSON.stringify({ message: 'Method Not Allowed' }));
                }
            }
        } else {
            return serverResponseUtil(res, 404, JSON.stringify({ message: 'Route Not Found' }));
            
        }
    } catch (err) {
        console.error('Internal server error:', err);
        serverResponseUtil(res, 500, JSON.stringify({ message: 'Internal Server Error' }));
        console.error('Unhandled error:', err);
    }
});
const workerPort = Number(process.env.PORT);
server.listen(workerPort, () => {
    console.log(`Worker ${process.pid} listening on port ${PORT}`);
  });
}
