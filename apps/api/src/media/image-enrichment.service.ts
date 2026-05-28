import { Injectable, Logger } from "@nestjs/common";

import { PexelsService } from "./pexels.service.js";
import { UnsplashService } from "./unsplash.service.js";
import type { ImagenEnriquecida, ImagenRef } from "./types.js";

/**
 * Router de enriquecimiento de imágenes.
 *
 * Recibe una `ImagenRef` que el LLM incluyó en una guía (sin URLs reales,
 * solo `tipo` + `query` + `alt`) y devuelve la misma ref con URLs reales,
 * autor y atribución. Si ninguna API está configurada o las búsquedas no
 * traen nada, devuelve la ref sin `urls` — el frontend muestra placeholder.
 *
 * Fallback automático: si el LLM pidió Unsplash pero `UNSPLASH_ACCESS_KEY` no
 * está, reroutea a Pexels con el mismo query. Lo mismo en sentido inverso.
 * Así arrancamos con solo una de las dos API keys.
 */
@Injectable()
export class ImageEnrichmentService {
  private readonly logger = new Logger(ImageEnrichmentService.name);

  constructor(
    private readonly pexels: PexelsService,
    private readonly unsplash: UnsplashService,
  ) {}

  async enrich(ref: ImagenRef): Promise<ImagenEnriquecida> {
    const provider = this.selectProvider(ref.tipo);

    if (provider === "pexels") {
      const result = await this.pexels.search(ref.query, ref.orientacion);
      if (result) {
        return {
          ...ref,
          tipo: "pexels",
          urls: result.urls,
          autor: result.autor,
          attribution: result.attribution,
        };
      }
    }

    if (provider === "unsplash") {
      const result = await this.unsplash.search(ref.query, ref.orientacion);
      if (result) {
        return {
          ...ref,
          tipo: "unsplash",
          urls: result.urls,
          autor: result.autor,
          attribution: result.attribution,
          // Unsplash production guidelines: el frontend debe disparar el GET
          // a este endpoint cuando muestre la imagen. Lo expone vía /media/track-download.
          downloadLocation: result.downloadLocation,
        };
      }
    }

    // Ninguno trajo resultado; devolvemos la ref sin URLs y el frontend
    // se encarga del placeholder.
    return ref;
  }

  async enrichAll(refs: ImagenRef[]): Promise<ImagenEnriquecida[]> {
    return Promise.all(refs.map((ref) => this.enrich(ref)));
  }

  /**
   * Decide qué proveedor usar para esta ref considerando qué API keys hay.
   * `wikimedia` y `banco_educai` no están implementados aún; degradan a la
   * combinación de proveedores disponibles.
   */
  private selectProvider(tipo: ImagenRef["tipo"]): "pexels" | "unsplash" | null {
    const pexelsOk = this.pexels.isConfigured();
    const unsplashOk = this.unsplash.isConfigured();

    if (!pexelsOk && !unsplashOk) {
      this.logger.debug({ event: "image_enrichment_no_provider_configured" });
      return null;
    }

    if (tipo === "pexels") {
      if (pexelsOk) return "pexels";
      if (unsplashOk) return "unsplash";
    }

    if (tipo === "unsplash") {
      if (unsplashOk) return "unsplash";
      if (pexelsOk) return "pexels";
    }

    // wikimedia, banco_educai, o cualquier otro tipo desconocido: usamos
    // el primero disponible. Unsplash tiene mejor curaduría visual para
    // imágenes educativas, lo preferimos cuando ambos están.
    if (unsplashOk) return "unsplash";
    if (pexelsOk) return "pexels";
    return null;
  }
}
