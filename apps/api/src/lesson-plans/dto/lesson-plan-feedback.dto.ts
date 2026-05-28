import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class LessonPlanFeedbackDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiProperty({ example: "Me ahorro preparacion, pero agregaria mas recursos.", required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
