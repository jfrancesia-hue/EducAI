import { IsEmail, IsInt, IsOptional, IsString, Max, Min, MinLength } from "class-validator";

export class CreateContactLeadDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  institution?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000000)
  quantity?: number;

  @IsOptional()
  @IsString()
  product?: string;

  @IsOptional()
  @IsString()
  plan?: string;

  @IsOptional()
  @IsString()
  message?: string;
}
