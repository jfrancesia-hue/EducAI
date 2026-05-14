import { IsOptional, IsString, MaxLength } from "class-validator";

export class CloseHandoffDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  resolutionNote?: string;
}
