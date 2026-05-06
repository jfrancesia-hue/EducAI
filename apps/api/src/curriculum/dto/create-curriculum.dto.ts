import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsObject, IsString, Max, MaxLength, Min, MinLength } from "class-validator";

export class CreateCurriculumDto {
  @ApiProperty({ example: "school_001" })
  @IsString()
  @MinLength(3)
  @MaxLength(128)
  schoolId!: string;

  @ApiProperty({ example: "Matematica 7A" })
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  name!: string;

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

  @ApiProperty({ example: { units: [] } })
  @IsObject()
  content!: Record<string, unknown>;
}
