import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsString, Max, MaxLength, Min, MinLength } from "class-validator";

export class GenerateLessonPlanDto {
  @ApiProperty({ example: "teacher_001" })
  @IsString()
  @MinLength(3)
  @MaxLength(128)
  teacherId!: string;

  @ApiProperty({ example: 7 })
  @IsInt()
  @Min(1)
  @Max(12)
  grade!: number;

  @ApiProperty({ example: "Matematica" })
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  subject!: string;

  @ApiProperty({ example: "Proporcionalidad" })
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  topic!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Max(12)
  sessionCount!: number;

  @ApiProperty({ example: 80 })
  @IsInt()
  @Min(20)
  @Max(1200)
  totalDurationMinutes!: number;
}
