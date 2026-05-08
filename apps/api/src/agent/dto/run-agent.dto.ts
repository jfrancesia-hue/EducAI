import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export const AGENT_MODES = ["planificacion", "evaluacion", "feedback", "diferenciacion"] as const;
export type AgentMode = (typeof AGENT_MODES)[number];

export class RunAgentDto {
  @ApiProperty({ enum: AGENT_MODES, example: "planificacion", required: false })
  @IsOptional()
  @IsString()
  @IsIn([...AGENT_MODES])
  mode?: AgentMode;

  @ApiProperty({ example: "7A", required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  grade?: string;

  @ApiProperty({ example: "Matematica", required: false })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  subject?: string;

  @ApiProperty({ example: "Fracciones equivalentes", required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  topic?: string;

  @ApiProperty({ example: "40 minutos", required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  duration?: string;

  @ApiProperty({
    example: "Necesito una clase con 3 niveles de dificultad y un ticket de salida.",
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  prompt?: string;
}
