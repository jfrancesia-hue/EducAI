import { SetMetadata } from "@nestjs/common";

import type { EducAiRole } from "./authenticated-user.js";

export const ROLES_KEY = "educai:roles";
export const Roles = (...roles: EducAiRole[]) => SetMetadata(ROLES_KEY, roles);
