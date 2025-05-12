import type { ServerResponse } from "http";

export function serverResponseUtil(response: ServerResponse, statusCode: number, body: string = ''){
    if (response.writableEnded) return;
        const headers = { 'Content-Type': 'application/json' };
        response.writeHead(statusCode, headers);
    return response.end(body);
}