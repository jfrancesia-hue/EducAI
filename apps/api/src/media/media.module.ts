import { Module } from "@nestjs/common";

import { ImageEnrichmentService } from "./image-enrichment.service.js";
import { PexelsService } from "./pexels.service.js";
import { UnsplashService } from "./unsplash.service.js";
import { VideoEnrichmentService } from "./video-enrichment.service.js";

/**
 * Módulo de enriquecimiento multimedia para guías docentes.
 *
 * Provee servicios que toman refs abstractas devueltas por el LLM
 * (`ImagenRef`, `VideoRef`) y las convierten en URLs reales de Pexels/
 * Unsplash/YouTube. Diseñado para fail-soft: si faltan API keys, los
 * servicios devuelven null y el frontend muestra placeholders.
 *
 * Para activar en producción:
 * - `PEXELS_API_KEY` (gratis, sin review).
 * - `UNSPLASH_ACCESS_KEY` (gratis, review para alta cuota).
 *
 * Con una sola de las dos el módulo funciona — el router reroutea
 * automáticamente al proveedor disponible.
 */
@Module({
  providers: [PexelsService, UnsplashService, ImageEnrichmentService, VideoEnrichmentService],
  exports: [ImageEnrichmentService, VideoEnrichmentService],
})
export class MediaModule {}
