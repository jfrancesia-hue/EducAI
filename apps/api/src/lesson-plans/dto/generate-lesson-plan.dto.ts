import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class GenerateLessonPlanDto {
  @ApiProperty({ example: 7 })
  @IsInt()
  @Min(1)
  @Max(12)
  grade!: number;

  @ApiProperty({ example: "matematica" })
  @IsString()
  subject!: string;

  @ApiProperty({ example: "proporcionalidad" })
  @IsString()
  topic!: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  @Max(10)
  sessionCount!: number;

  @ApiProperty({ example: 80 })
  @IsInt()
  @Min(10)
  @Max(600)
  totalDurationMinutes!: number;

  @ApiProperty({
    example: "Que puedan resolver proporcionalidad directa en problemas cotidianos",
    required: false,
  })
  @IsOptional()
  @IsString()
  learningGoal?: string;

  @ApiProperty({ example: "7A, 28 estudiantes, grupo heterogeneo", required: false })
  @IsOptional()
  @IsString()
  groupProfile?: string;

  @ApiProperty({ example: "Ya trabajaron fracciones y tablas simples", required: false })
  @IsOptional()
  @IsString()
  priorKnowledge?: string;

  @ApiProperty({ example: "NAP / diseno curricular jurisdiccional", required: false })
  @IsOptional()
  @IsString()
  curriculumContext?: string;

  @ApiProperty({ example: "Pizarron, celulares, fotocopias", required: false })
  @IsOptional()
  @IsString()
  availableResources?: string;

  @ApiProperty({ example: "Explicar estrategia y justificar resultados", required: false })
  @IsOptional()
  @IsString()
  assessmentFocus?: string;

  @ApiProperty({ example: "Consignas breves y apoyo visual para dos estudiantes", required: false })
  @IsOptional()
  @IsString()
  inclusionNeeds?: string;

  @ApiProperty({ example: "Guia editable con cierre y ticket de salida", required: false })
  @IsOptional()
  @IsString()
  outputFormat?: string;
}
