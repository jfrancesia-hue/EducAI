import { ApiProperty } from "@nestjs/swagger";
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from "class-validator";

const EDUCATION_LEVELS = ["primaria", "secundaria", "terciario", "universitario"] as const;

export class GenerateLessonPlanDto {
  @ApiProperty({ example: "secundaria", enum: EDUCATION_LEVELS })
  @IsIn(EDUCATION_LEVELS)
  educationLevel!: (typeof EDUCATION_LEVELS)[number];

  @ApiProperty({ example: 7 })
  @IsInt()
  @Min(1)
  @Max(12)
  grade!: number;

  @ApiProperty({ example: "matematica" })
  @IsString()
  subject!: string;

  @ApiProperty({ example: "7A / primer anio / comision 2", required: false })
  @IsOptional()
  @IsString()
  courseLabel?: string;

  @ApiProperty({ example: "Colegio del Valle", required: false })
  @IsOptional()
  @IsString()
  institutionName?: string;

  @ApiProperty({ example: "Introducir un tema", required: false })
  @IsOptional()
  @IsString()
  lessonIntent?: string;

  @ApiProperty({
    example: "Ciencias Naturales / plan 2024 / proyecto institucional",
    required: false,
  })
  @IsOptional()
  @IsString()
  levelContext?: string;

  @ApiProperty({ example: "2026-06-15", required: false })
  @IsOptional()
  @IsString()
  plannedDate?: string;

  @ApiProperty({ example: "Ingenieria en sistemas", required: false })
  @ValidateIf((input: GenerateLessonPlanDto) => input.educationLevel === "universitario")
  @IsString()
  @IsNotEmpty()
  careerName?: string;

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
