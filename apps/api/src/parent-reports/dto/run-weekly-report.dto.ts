import { ApiProperty } from "@nestjs/swagger";
import { IsISO8601, IsNotEmpty, IsString } from "class-validator";

export class RunWeeklyReportDto {
  @ApiProperty({ example: "fam_abc123" })
  @IsString()
  @IsNotEmpty()
  familyId!: string;

  @ApiProperty({ example: "tnt_xyz789" })
  @IsString()
  @IsNotEmpty()
  tenantId!: string;

  @ApiProperty({ example: "2026-05-19T00:00:00.000Z" })
  @IsISO8601()
  periodStart!: string;

  @ApiProperty({ example: "2026-05-26T00:00:00.000Z" })
  @IsISO8601()
  periodEnd!: string;
}
