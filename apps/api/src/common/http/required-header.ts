import { BadRequestException } from "@nestjs/common";

export function requireHeader(value: string | string[] | undefined, headerName: string): string {
  const normalized = Array.isArray(value) ? value[0] : value;
  const trimmed = normalized?.trim();

  if (!trimmed) {
    throw new BadRequestException(`Falta el header requerido ${headerName}`);
  }

  return trimmed;
}
