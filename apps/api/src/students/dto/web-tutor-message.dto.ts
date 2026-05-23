import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class WebTutorMessageDto {
  @ApiProperty({ example: "No entiendo como sumar fracciones" })
  @IsString()
  @MinLength(2)
  @MaxLength(1200)
  message!: string;

  @ApiProperty({ example: "matematica", required: false })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  subject?: string;
}
