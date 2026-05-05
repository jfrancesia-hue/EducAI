import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsString } from "class-validator";

export class DiagnosticAnswerDto {
  @ApiProperty({ example: "prof_1-3" })
  @IsString()
  questionId!: string;

  @ApiProperty({
    example: "A",
    description: "Letra elegida por el alumno (A, B, C o D)",
    enum: ["A", "B", "C", "D"],
  })
  @IsString()
  @IsIn(["A", "B", "C", "D"])
  answer!: string;
}
