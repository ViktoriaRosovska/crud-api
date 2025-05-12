import type { ServerResponse } from "http";

export function serverResponseUtil(response: ServerResponse, statusCode: number, body: string){
    response.writeHead(statusCode, { 'Content-Type': 'application/json' });
    return response.end(body || '');
}