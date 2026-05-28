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

  // Los campos pedagógicos opcionales abajo se aceptan en el DTO para
  // mantener el contrato del producto, pero hoy NO se persisten:
  // el schema Prisma no tiene un JSON libre en Classroom. Los dejamos
  // ingresados para que el frontend ya pueda enviarlos y, cuando se
  // amplíe Classroom (campo metadata Json?), se persistan sin romper
  // el contrato. Por ahora el service los ignora sin tirar error.
  @ApiProperty({
    example: "Grupo heterogéneo, ritmo medio, mucha participación oral",
    required: false,
    description: "Perfil del grupo. Opcional. Hoy no se persiste (pendiente de migración).",
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  groupProfile?: string;

  @ApiProperty({
    example: "Ya trabajaron fracciones y tablas simples",
    required: false,
    description: "Saberes previos del grupo. Opcional. Hoy no se persiste.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  priorKnowledge?: string;

  @ApiProperty({
    example: "Pizarrón, fotocopias, proyector compartido",
    required: false,
    description: "Recursos disponibles. Opcional. Hoy no se persiste.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  availableResources?: string;

  @ApiProperty({
    example: "Consignas breves y apoyo visual para algunos estudiantes",
    required: false,
    description: "Adaptaciones generales. Opcional. Hoy no se persiste.",
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
