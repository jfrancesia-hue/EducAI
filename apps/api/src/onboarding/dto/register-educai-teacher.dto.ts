import { IsEmail, IsIn, IsOptional, IsString, MinLength } from "class-validator";

export class RegisterEducAiTeacherDto {
  @IsIn(["free", "docente-individual", "docente-pro"])
  plan!: "free" | "docente-individual" | "docente-pro";

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  fullName!: string;

  @IsOptional()
  @IsString()
  schoolName?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  subjects?: string;
}

export class RegisterEducAiTeacherWithGoogleDto {
  @IsIn(["free", "docente-individual", "docente-pro"])
  plan!: "free" | "docente-individual" | "docente-pro";

  @IsString()
  fullName!: string;

  @IsOptional()
  @IsString()
  schoolName?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  subjects?: string;
}
