import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class RevokeConsentDto {
  @ApiProperty({
    example: "Cambio de tutor legal",
    required: false,
    description: "Motivo opcional registrado para auditoria",
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  reason?: string;
}
