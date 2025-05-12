
import { ServerResponse } from 'http';
import serverHandler from '../src/serverHandler/serverHandler';
import { Readable } from 'stream';
import { crudDB } from '../src/db/crud-db';
import { createServer } from 'http';


const port = process.env.TEST_PORT || 5000;
const server = createServer(serverHandler);
server.listen(port);

beforeEach(() => {
  crudDB.length = 0;
  crudDB.push(
      {
          id: 'b8fa698a-c26d-4f8a-a9a2-f6e6d6fdf4c6',
          username: "Ivan",
          age: 43,
          hobbies: ["football", "horseriding"]
      },
      {
          id: 'b8fa698a-c26d-4f8a-a9a2-f6e6d6fdf4c7',
          username: "Igor",
          age: 53,
          hobbies: ["reading", "swiming"]
      }
  );
});

describe('crud api/users', () => {
  it('handles POST /api/users', async () => {
    const req = new Readable({
      read() {
        this.push(JSON.stringify({ username: 'Irina', age: 18, hobbies: ['gaming'] }));
        this.push(null);
      },
    }) as any;
    req.url = '/api/users';
    req.method = 'POST';
    req.headers = { 'content-type': 'application/json' };
  
    const res: any = {
      writableEnded: false,
      writeHead: jest.fn(),
      end: jest.fn(),
    };
  
    await serverHandler(req, res);
  
    expect(res.writeHead).toHaveBeenCalledWith(201, { 'Content-Type': 'application/json' });
  });
  it('return all users in database', async () => {
    const req = new Readable() as any;
    req.url = '/api/users';
    req.method = 'GET';
    req.headers = { 'content-type': 'application/json' };

    let statusCode = 0;
    let responseData = '';

    const res = {
      writableEnded: false,
      writeHead: (code: number) => {
        statusCode = code;
      },
      end: (data: any) => {
        responseData = data;
      },
    } as unknown as ServerResponse;

    await serverHandler(req, res);

    const parsedResponse = JSON.parse(responseData);

    expect(statusCode).toBe(200);
    expect(Array.isArray(parsedResponse)).toBe(true);
    expect(parsedResponse.length).toBe(2);
    expect(parsedResponse[0]).toHaveProperty('username', 'Ivan');
  });
  
  it('delete user by ID and return и 204', async () => {
    const req = new Readable() as any;
    req.url = '/api/users/b8fa698a-c26d-4f8a-a9a2-f6e6d6fdf4c6';
    req.method = 'DELETE';
    req.headers = { 'content-type': 'application/json' };

    let statusCode = 0;
    let responseData = '';

    const res = {
      writableEnded: false,
      writeHead: (code: number, _headers: any) => {
        statusCode = code;
      },
      end: (data: any) => {
        responseData = data;
      },
    } as unknown as ServerResponse;

    await serverHandler(req, res);

    expect(statusCode).toBe(204);
    expect(responseData).toBe('');
    expect(crudDB.length).toBe(1);
    expect(crudDB.find((user) => user.id === 'b8fa698a-c26d-4f8a-a9a2-f6e6d6fdf4c6')).toBeUndefined();
  });
});

