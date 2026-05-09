import { Injectable, NestMiddleware } from "@nestjs/common";
import { nanoid } from "nanoid";
import type { NextFunction, Request, Response } from "express";

const HEADER = "x-request-id";

/**
 * Asigna o respeta un request-id por request para correlacionar logs.
 *
 * Si el cliente envia x-request-id, lo aceptamos (util para tracing
 * distribuido). Si no, generamos uno con nanoid (12 chars, URL-safe).
 * El id queda en res.locals.requestId y como header de respuesta.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const incoming = req.headers[HEADER];
    const value =
      typeof incoming === "string" && incoming.trim().length > 0 && incoming.length <= 64
        ? incoming.trim()
        : nanoid(12);

    res.locals.requestId = value;
    res.setHeader(HEADER, value);
    next();
  }
}
