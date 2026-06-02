import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

// Teléfono en formato internacional flexible (E.164-ish): opcional "+" y 8 a 15 dígitos.
const PHONE_REGEX = /^\+?\d{8,15}$/;
const PHONE_MESSAGE = "El teléfono debe tener entre 8 y 15 dígitos (formato internacional).";
// Tope defensivo de hijos por request (el límite real por plan se valida aparte).
const MAX_STUDENTS_PER_REQUEST = 10;

export class RegisterApoyoAiStudentDto {
  @IsString()
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @MaxLength(80)
  lastName!: string;

  @IsInt()
  @Min(1)
  @Max(12)
  grade!: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  curriculum?: string;

  @IsOptional()
  @Matches(PHONE_REGEX, { message: PHONE_MESSAGE })
  whatsappPhone?: string;
}

export class RegisterApoyoAiFamilyDto {
  @IsIn(["free", "basico", "plus", "familiar", "intensivo"])
  plan!: "free" | "basico" | "plus" | "familiar" | "intensivo";

  @IsEmail()
  @MaxLength(160)
  parentEmail!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsString()
  @MaxLength(120)
  parentFullName!: string;

  @Matches(PHONE_REGEX, { message: PHONE_MESSAGE })
  parentWhatsappPhone!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_STUDENTS_PER_REQUEST)
  @ValidateNested({ each: true })
  @Type(() => RegisterApoyoAiStudentDto)
  students!: RegisterApoyoAiStudentDto[];
}

export class RegisterApoyoAiFamilyWithGoogleDto {
  @IsIn(["free", "basico", "plus", "familiar", "intensivo"])
  plan!: "free" | "basico" | "plus" | "familiar" | "intensivo";

  @IsString()
  @MaxLength(120)
  parentFullName!: string;

  @Matches(PHONE_REGEX, { message: PHONE_MESSAGE })
  parentWhatsappPhone!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_STUDENTS_PER_REQUEST)
  @ValidateNested({ each: true })
  @Type(() => RegisterApoyoAiStudentDto)
  students!: RegisterApoyoAiStudentDto[];
}
