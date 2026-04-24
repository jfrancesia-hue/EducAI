import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsString } from "class-validator";

export class DiagnosticAnswerDto {
  @ApiProperty()
  @IsString()
  questionId!: string;

  @ApiProperty()
  @IsString()
  answer!: string;

  @ApiProperty()
  @IsBoolean()
  correct!: boolean;
}

