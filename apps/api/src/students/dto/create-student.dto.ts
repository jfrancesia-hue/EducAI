import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";

export class CreateStudentDto {
  @ApiProperty({ example: "tenant_family_001" })
  @IsString()
  @MinLength(3)
  @MaxLength(128)
  tenantId!: string;

  @ApiProperty({ example: "family_001" })
  @IsString()
  @MinLength(3)
  @MaxLength(128)
  familyId!: string;

  @ApiProperty({ example: "Mateo" })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName!: string;

  @ApiProperty({ example: "Garcia" })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName!: string;

  @ApiProperty({ example: 6 })
  @IsInt()
  @Min(1)
  @Max(12)
  grade!: number;

  @ApiProperty({ example: "AR-NOA", required: false })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  curriculum?: string;

  @ApiProperty({ example: "+5493815550202", required: false })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  whatsappPhone?: string;
}
