import { Injectable, Logger } from "@nestjs/common";

import { queryFallback } from "./stock-query-fallback.js";
import type { ImagenOrientacion, ImagenUrls } from "./types.js";

const PEXELS_ENDPOINT = "https://api.pexels.com/v1/search";
const REQUEST_TIMEOUT_MS = 5000;

type PexelsOrientation = "landscape" | "portrait" | "square";

interface PexelsPhoto {
  src: {
    small: string;
    medium: string;
    large: string;
    large2x: string;
    original: string;
    landscape: string;
    portrait: string;
  };
  photographer: string;
  photographer_url: string;
  alt: string;
}

interface PexelsSearchResponse {
  photos?: PexelsPhoto[];
}

export interface PexelsResult {
  urls: ImagenUrls;
  autor: { name: string; profileUrl?: string };
  attribution: string;
  altRecibido: string;
}

@Injectable()
export class PexelsService {
  private readonly logger = new Logger(PexelsService.name);
  private readonly apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.PEXELS_API_KEY?.trim() || undefined;
  }

  /** True si la API key está configurada y el servicio es funcional. */
  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  /**
   * Busca una foto. Si el query no devuelve nada, intenta con un fallback más
   * corto antes de rendirse. Errores y timeouts loguean warning y devuelven null
   * — la generación nunca debe romperse por falta de imagen.
   */
  async search(
    query: string,
    orientacion: ImagenOrientacion = "horizontal",
  ): Promise<PexelsResult | null> {
    if (!this.apiKey) return null;
    if (!query.trim()) return null;

    const pexelsOrientation = this.toPexelsOrientation(orientacion);

    const primary = await this.fetchOne(query, pexelsOrientation);
    if (primary) return this.toResult(primary);

    const fallback = queryFallback(query);
    if (fallback && fallback !== query) {
      const secondary = await this.fetchOne(fallback, pexelsOrientation);
      if (secondary) return this.toResult(secondary);
    }

    return null;
  }

  /** Versión thumbnail-only para enriquecer videos sin embedId. */
  async fetchThumbnail(query: string): Promise<string | null> {
    if (!this.apiKey || !query.trim()) return null;
    const photo = await this.fetchOne(query, "landscape");
    return photo?.src.medium ?? null;
  }

  private toPexelsOrientation(orientacion: ImagenOrientacion): PexelsOrientation {
    if (orientacion === "vertical") return "portrait";
    if (orientacion === "cuadrada") return "square";
    return "landscape";
  }

  private async fetchOne(
    query: string,
    orientation: PexelsOrientation,
  ): Promise<PexelsPhoto | null> {
    const params = new URLSearchParams({
      query,
      per_page: "5",
      orientation,
    });

    try {
      const response = await fetch(`${PEXELS_ENDPOINT}?${params.toString()}`, {
        headers: { Authorization: this.apiKey! },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) {
        this.logger.warn({
          event: "pexels.search_failed",
          status: response.status,
          query,
        });
        return null;
      }
      const data = (await response.json()) as PexelsSearchResponse;
      return data.photos?.[0] ?? null;
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";
      this.logger.warn({ event: "pexels.search_error", query, message });
      return null;
    }
  }

  private toResult(photo: PexelsPhoto): PexelsResult {
    return {
      urls: {
        thumbnail: photo.src.small,
        medium: photo.src.medium,
        large: photo.src.large,
      },
      autor: {
        name: photo.photographer,
        profileUrl: photo.photographer_url,
      },
      attribution: `Foto por ${photo.photographer} en Pexels`,
      altRecibido: photo.alt,
    };
  }
}
