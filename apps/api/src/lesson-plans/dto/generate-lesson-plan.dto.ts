import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsString, Max, Min } from "class-validator";

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
}
