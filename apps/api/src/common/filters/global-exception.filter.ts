import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import type { Request, Response } from "express";
import type { Logger } from "pino";
import { AppLogger } from "../logger/app-logger.service.js";

interface ErrorPayload {
  code: string;
  message: string;
  requestId?: string;
}

const ERROR_NAME_TO_CODE: Record<string, string> = {
  ValidationError: "VALIDATION_ERROR",
  UnauthorizedException: "UNAUTHORIZED",
  ForbiddenException: "FORBIDDEN",
  NotFoundException: "NOT_FOUND",
  ConflictException: "CONFLICT",
  BadRequestException: "BAD_REQUEST",
};

/**
 * Filter global. Convierte cualquier error en una respuesta JSON con shape
 * estable y un requestId correlacionable. Saca stack traces y nombres
 * internos del payload visible al cliente; los completos van al logger.
 */
@Catch()
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly log: Logger;

  constructor(logger: AppLogger) {
    this.log = logger.child({ component: "GlobalExceptionFilter" });
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = (response.locals?.requestId as string | undefined) ?? undefined;

    const { status, payload } = this.toHttpPayload(exception);
    if (requestId) {
      payload.requestId = requestId;
    }

    if (status >= 500) {
      this.log.error(
        {
          err: exception instanceof Error ? exception.message : String(exception),
          stack: exception instanceof Error ? exception.stack : undefined,
          path: request.originalUrl ?? request.url,
          method: request.method,
          requestId,
        },
        "exception.unhandled",
      );
    } else if (status >= 400) {
      this.log.warn(
        {
          code: payload.code,
          message: payload.message,
          path: request.originalUrl ?? request.url,
          method: request.method,
          requestId,
        },
        "exception.http",
      );
    }

    response.status(status).json(payload);
  }

  private toHttpPayload(exception: unknown): { status: number; payload: ErrorPayload } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === "string") {
        return {
          status,
          payload: {
            code: ERROR_NAME_TO_CODE[exception.name] ?? "HTTP_ERROR",
            message: body,
          },
        };
      }

      if (body && typeof body === "object") {
        const obj = body as Record<string, unknown>;
        const code =
          typeof obj.code === "string"
            ? obj.code
            : (ERROR_NAME_TO_CODE[exception.name] ?? "HTTP_ERROR");
        const message =
          typeof obj.message === "string"
            ? obj.message
            : Array.isArray(obj.message)
              ? obj.message.join(", ")
              : exception.message;
        return {
          status,
          payload: { code, message },
        };
      }
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      payload: {
        code: "INTERNAL_ERROR",
        message: "Tuvimos un problema procesando tu solicitud",
      },
    };
  }
}
