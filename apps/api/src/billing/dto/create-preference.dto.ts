import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsString, MaxLength, MinLength } from "class-validator";

export const BILLING_PLANS = ["BASIC", "PREMIUM", "FAMILY"] as const;
export type BillingPlan = (typeof BILLING_PLANS)[number];

export class CreatePreferenceDto {
  @ApiProperty({ enum: BILLING_PLANS, example: "BASIC" })
  @IsString()
  @IsIn([...BILLING_PLANS])
  plan!: BillingPlan;

  @ApiProperty({ example: "fam_abc123" })
  @IsString()
  @MinLength(3)
  @MaxLength(128)
  familyId!: string;
}
