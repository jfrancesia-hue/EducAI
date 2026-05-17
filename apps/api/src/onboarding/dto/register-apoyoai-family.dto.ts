import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

export class RegisterApoyoAiStudentDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsInt()
  @Min(1)
  @Max(12)
  grade!: number;

  @IsOptional()
  @IsString()
  curriculum?: string;

  @IsOptional()
  @IsString()
  whatsappPhone?: string;
}

export class RegisterApoyoAiFamilyDto {
  @IsIn(["free", "basico", "plus", "familiar", "intensivo"])
  plan!: "free" | "basico" | "plus" | "familiar" | "intensivo";

  @IsEmail()
  parentEmail!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  parentFullName!: string;

  @IsString()
  parentWhatsappPhone!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RegisterApoyoAiStudentDto)
  students!: RegisterApoyoAiStudentDto[];
}
