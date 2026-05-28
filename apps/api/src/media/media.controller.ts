import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { RolesGuard } from "../auth/roles.guard.js";
import { Roles } from "../auth/roles.decorator.js";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard.js";
import { TrackUnsplashDownloadDto } from "./dto/track-unsplash-download.dto.js";
import { UnsplashService } from "./unsplash.service.js";

/**
 * Endpoints utilitarios del módulo de media.
 *
 * `POST /media/track-download` recibe el `downloadLocation` de una imagen
 * Unsplash y dispara el GET autenticado contra la API de Unsplash. Es
 * requisito de las API guidelines de producción de Unsplash: cada uso real
 * de una foto debe reportarse para que el fotógrafo reciba la métrica.
 *
 * Cualquier usuario autenticado puede dispararlo (es benigno para nuestro
 * sistema; lo único que hace es pegar una URL del dominio api.unsplash.com).
 * El DTO valida que la URL pertenezca a ese dominio.
 */
@ApiTags("media")
@ApiBearerAuth()
@Controller("media")
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles("TEACHER", "SCHOOL_ADMIN", "PARENT", "SUPER_ADMIN", "MINISTRY")
export class MediaController {
  constructor(private readonly unsplash: UnsplashService) {}

  @Post("track-download")
  @HttpCode(HttpStatus.NO_CONTENT)
  async trackDownload(@Body() body: TrackUnsplashDownloadDto): Promise<void> {
    await this.unsplash.trackDownload(body.downloadLocation);
  }
}
