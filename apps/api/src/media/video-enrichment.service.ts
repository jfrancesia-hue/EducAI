import { Injectable } from "@nestjs/common";

import { PexelsService } from "./pexels.service.js";
import { UnsplashService } from "./unsplash.service.js";
import type { VideoEnriquecido, VideoRef } from "./types.js";

/**
 * Enriquece una referencia de video pedagógico:
 *
 * - Si el LLM tiró un `embedId` de YouTube con confianza alta, armamos el
 *   `urlEmbed` oficial + thumbnail (`hqdefault.jpg`) y marcamos
 *   `verificado: true`. El frontend puede embeber sin riesgo.
 *
 * - Si NO hay `embedId`, NO inventamos URLs (la regla del proveedor original):
 *   intentamos un thumbnail "ambiental" desde Pexels/Unsplash usando
 *   `queryBusqueda` (ej: "Amazonia documental" → foto de selva). El frontend
 *   muestra el thumbnail con un botón "Buscar en YouTube" en lugar de un
 *   iframe que se podría romper.
 */
@Injectable()
export class VideoEnrichmentService {
  constructor(
    private readonly pexels: PexelsService,
    private readonly unsplash: UnsplashService,
  ) {}

  async enrich(ref: VideoRef): Promise<VideoEnriquecido> {
    const urlBusqueda = `https://www.youtube.com/results?search_query=${encodeURIComponent(ref.queryBusqueda)}`;

    if (ref.embedId?.trim()) {
      return {
        ...ref,
        thumbnail: `https://i.ytimg.com/vi/${ref.embedId}/hqdefault.jpg`,
        urlEmbed: `https://www.youtube.com/embed/${ref.embedId}`,
        urlBusqueda,
        verificado: true,
      };
    }

    const thumbnail = await this.fetchAmbientalThumbnail(ref.queryBusqueda);

    return {
      ...ref,
      thumbnail: thumbnail ?? undefined,
      urlBusqueda,
      verificado: false,
    };
  }

  async enrichAll(refs: VideoRef[]): Promise<VideoEnriquecido[]> {
    return Promise.all(refs.map((ref) => this.enrich(ref)));
  }

  private async fetchAmbientalThumbnail(query: string): Promise<string | null> {
    if (!query.trim()) return null;
    // Orden de caída: Pexels (gratis sin review) → Unsplash → null.
    const pexels = await this.pexels.fetchThumbnail(query);
    if (pexels) return pexels;
    const unsplash = await this.unsplash.fetchThumbnail(query);
    return unsplash;
  }
}
