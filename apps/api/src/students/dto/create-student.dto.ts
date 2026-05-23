import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateStudentDto {
  @ApiProperty({ example: "Mateo" })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: "Francesia" })
  @IsString()
  lastName!: string;

  @ApiProperty({ example: 6 })
  @IsInt()
  @Min(1)
  @Max(12)
  grade!: number;

  @ApiProperty({ example: "AR-NOA", required: false })
  @IsOptional()
  @IsString()
  curriculum?: string;

  @ApiProperty({ example: "+5493815550202", required: false })
  @IsOptional()
  @IsString()
  whatsappPhone?: string;

  @ApiProperty({ example: "+5493815550101", required: false })
  @IsOptional()
  @IsString()
  parentWhatsappPhone?: string;
}
