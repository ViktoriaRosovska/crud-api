import { createServer } from 'http';
import dotenv from 'dotenv';
import { crudDB } from './db/crud-db.js';
import { v4 as uuidv4, validate } from 'uuid';
import type { User} from "./types/type.js"
import { serverResponseUtil } from './utils/serverResponseUtil.js';

console.log("Hello");

dotenv.config();

const PORT = process.env.PORT || 4000;

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

const server = createServer(async (req, res) => {
    try {
        const url = req.url;
        const method = req.method;
        const userId = url?.split('/')[3];
        if (url?.startsWith('/api/users')) {
            const contentType = req.headers['content-type'];
            if (contentType !== 'application/json') {
                serverResponseUtil(res, 400, JSON.stringify({ message: 'Content-Type must be application/json' }))
            }
            switch (method) {
                case 'GET': {
                    if (userId) {
                    const user = crudDB.find((user) => user.id === userId);
                    if (!user) {
                        serverResponseUtil(res, 404, JSON.stringify({ message: 'User not found' }))
                    }
                    serverResponseUtil(res, 200, JSON.stringify(user));
                    } else {
                        serverResponseUtil(res, 200, JSON.stringify(crudDB))
                    };
                break;
                } 
                case 'POST': {
                    let body = '';
                    req.on('data', chunk => body += chunk);
                    req.on('end', () => {
                    try {
                        const data = JSON.parse(body);
                    if (!data.username || !data.age || !Array.isArray(data.hobbies) || !data.hobbies.every((h: string) => typeof h === 'string')) {
                        serverResponseUtil(res, 400, JSON.stringify({message: 'Invalid user data'}));
                    }
                    const newUser: User = {
                        id: uuidv4(),
                        username: data.username,
                        age: data.age,
                        hobbies: data.hobbies
                    }
                    crudDB.push(newUser);
                    serverResponseUtil(res, 201, JSON.stringify(newUser))
                } catch (error) {
                    serverResponseUtil(res, 400, JSON.stringify({ message: 'Invalid JSON' }));
                }
            })
            break;
                }
                case 'PUT': {
                    let body = '';
                    req.on('data', chunk => body += chunk);
                    req.on('end', () => {
                        try {
                            if (!validate(userId!)) {
                                serverResponseUtil(res, 400, JSON.stringify( {message: 'Invalid UUID'}));
                            }
                            let findUser = crudDB.find(user => userId === user.id);
                            if (!findUser) {
                                serverResponseUtil(res, 404, JSON.stringify( {message: 'User not found'}));
                            }
                            const data = JSON.parse(body);
                            if (!data.username || !data.age || !Array.isArray(data.hobbies) || !data.hobbies.every((h: string) => typeof h === 'string')) {
                                serverResponseUtil(res, 400, JSON.stringify({message: 'Invalid user data'}));
                            }
                            if (findUser) {
                                const index = crudDB.indexOf(findUser);
                                const updateUser = {...crudDB[index], ...data};
                                crudDB[index] = {...updateUser};
                            serverResponseUtil(res, 200, JSON.stringify(updateUser));
                        }
                        } catch (error) {              
                            serverResponseUtil(res, 400, JSON.stringify({ message: 'Invalid JSON' }));
                        }
                    })
                    break;
                }
                case 'DELETE': {
                        let body = '';
                        req.on('data', chunk => body += chunk);
                        req.on('end', () => {
                            try {
                                if (!validate(userId!)) {
                                    serverResponseUtil(res, 400, 'Invalid UUID')
                                }
                                const index = crudDB.findIndex(user => user.id === userId);
                                if (index === -1) {
                                    serverResponseUtil(res, 404, JSON.stringify({ message: 'User not found' }))
                                }
                                crudDB.splice(index, 1); 
                                serverResponseUtil(res, 204, '');
                            } catch (error) {
                                    serverResponseUtil(res, 400, JSON.stringify({ message: 'Invalid JSON' }));
                            }
                        })
                        break;
                }
                default: {
                    serverResponseUtil(res, 405, JSON.stringify({ message: 'Method Not Allowed' }));
                }
            }
        } else {
            serverResponseUtil(res, 404, JSON.stringify({ message: 'Route Not Found' }));
        }
    } catch (err) {
        console.error('Internal server error:', err);
        serverResponseUtil(res, 500, JSON.stringify({ message: 'Internal Server Error' }));
    }
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });