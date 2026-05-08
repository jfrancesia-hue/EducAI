import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsString, MaxLength, MinLength } from "class-validator";

export class SignConsentDto {
  @ApiProperty({ example: "stu_abc123" })
  @IsString()
  @MinLength(3)
  @MaxLength(128)
  studentId!: string;

  @ApiProperty({ example: "v1.0-2026-05-07" })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  documentVersion!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  termsAccepted!: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  privacyAccepted!: boolean;

  @ApiProperty({ example: true, description: "Procesamiento por modelos de IA" })
  @IsBoolean()
  aiProcessingAccepted!: boolean;
}
