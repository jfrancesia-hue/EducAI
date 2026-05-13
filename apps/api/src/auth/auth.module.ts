import { Module } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { RolesGuard } from "./roles.guard.js";
import { SupabaseAuthGuard } from "./supabase-auth.guard.js";
import { SupabaseAuthService } from "./supabase-auth.service.js";

@Module({
  providers: [Reflector, SupabaseAuthService, SupabaseAuthGuard, RolesGuard],
  exports: [SupabaseAuthService, SupabaseAuthGuard, RolesGuard],
})
export class AuthModule {}
