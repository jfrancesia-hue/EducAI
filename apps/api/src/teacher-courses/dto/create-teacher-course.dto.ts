import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";

export class CreateTeacherCourseDto {
  @ApiProperty({
    example: "7A",
    description: "Nombre o etiqueta corta del curso (ej: 7A, 2do B, comisión noche)",
  })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @ApiProperty({ example: 7, description: "Año o grado (1-12)" })
  @IsInt()
  @Min(1)
  @Max(12)
  grade!: number;

  @ApiProperty({ example: "Matemática", description: "Materia principal del curso" })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  subject!: string;

  @ApiProperty({ example: "Mañana", required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  shift?: string;

  @ApiProperty({
    example: 28,
    required: false,
    description: "Cantidad de alumnos. Opcional.",
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  studentCount?: number;

  // Campos pedagógicos opcionales que se persisten en `Classroom.metadata`
  // (JSON libre) y alimentan el prompt del generador cuando el docente elige
  // este curso al planificar.
  @ApiProperty({
    example: "Grupo heterogéneo, ritmo medio, mucha participación oral",
    required: false,
    description: "Perfil del grupo. Opcional.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  groupProfile?: string;

  @ApiProperty({
    example: "Ya trabajaron fracciones y tablas simples",
    required: false,
    description: "Saberes previos del grupo. Opcional.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  priorKnowledge?: string;

  @ApiProperty({
    example: "Pizarrón, fotocopias, proyector compartido",
    required: false,
    description: "Recursos disponibles. Opcional.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  availableResources?: string;

  @ApiProperty({
    example: "Consignas breves y apoyo visual para algunos estudiantes",
    required: false,
    description: "Adaptaciones generales. Opcional.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  inclusionNotes?: string;

  @ApiProperty({
    example: "Colegio del Valle",
    required: false,
    description: "Nombre de la institución para enriquecer el prompt. Opcional.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  institutionName?: string;
}
