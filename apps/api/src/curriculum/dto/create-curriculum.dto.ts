import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsObject, IsString, Max, Min } from "class-validator";

export class CreateCurriculumDto {
  @ApiProperty({ example: "Matematica 7A" })
  @IsString()
  name!: string;

  @ApiProperty({ example: 7 })
  @IsInt()
  @Min(1)
  @Max(12)
  grade!: number;

  @ApiProperty({ example: "matematica" })
  @IsString()
  subject!: string;

  @ApiProperty({ example: { unit: "proporcionalidad", goals: ["resolver problemas"] } })
  @IsObject()
  content!: Record<string, unknown>;
}
