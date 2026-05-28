import { Injectable, Logger } from "@nestjs/common";

import { queryFallback } from "./stock-query-fallback.js";
import type { ImagenOrientacion, ImagenUrls } from "./types.js";

const UNSPLASH_ENDPOINT = "https://api.unsplash.com/search/photos";
const REQUEST_TIMEOUT_MS = 5000;

type UnsplashOrientation = "landscape" | "portrait" | "squarish";

interface UnsplashPhoto {
  urls: { small: string; regular: string; full: string };
  user: { name: string; links: { html: string } };
  alt_description?: string;
}

interface UnsplashSearchResponse {
  results?: UnsplashPhoto[];
}

export interface UnsplashResult {
  urls: ImagenUrls;
  autor: { name: string; profileUrl?: string };
  attribution: string;
  altRecibido: string;
}

@Injectable()
export class UnsplashService {
  private readonly logger = new Logger(UnsplashService.name);
  private readonly accessKey: string | undefined;

  constructor() {
    this.accessKey = process.env.UNSPLASH_ACCESS_KEY?.trim() || undefined;
  }

  isConfigured(): boolean {
    return Boolean(this.accessKey);
  }

  async search(
    query: string,
    orientacion: ImagenOrientacion = "horizontal",
  ): Promise<UnsplashResult | null> {
    if (!this.accessKey) return null;
    if (!query.trim()) return null;

    const orientation = this.toUnsplashOrientation(orientacion);
    const primary = await this.fetchOne(query, orientation);
    if (primary) return this.toResult(primary);

    const fallback = queryFallback(query);
    if (fallback && fallback !== query) {
      const secondary = await this.fetchOne(fallback, orientation);
      if (secondary) return this.toResult(secondary);
    }

    return null;
  }

  async fetchThumbnail(query: string): Promise<string | null> {
    if (!this.accessKey || !query.trim()) return null;
    const photo = await this.fetchOne(query, "landscape");
    return photo?.urls.small ?? null;
  }

  private toUnsplashOrientation(orientacion: ImagenOrientacion): UnsplashOrientation {
    if (orientacion === "vertical") return "portrait";
    if (orientacion === "cuadrada") return "squarish";
    return "landscape";
  }

  private async fetchOne(
    query: string,
    orientation: UnsplashOrientation,
  ): Promise<UnsplashPhoto | null> {
    const params = new URLSearchParams({
      query,
      per_page: "5",
      orientation,
      content_filter: "high",
    });

    try {
      const response = await fetch(`${UNSPLASH_ENDPOINT}?${params.toString()}`, {
        headers: { Authorization: `Client-ID ${this.accessKey!}` },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) {
        this.logger.warn({
          event: "unsplash.search_failed",
          status: response.status,
          query,
        });
        return null;
      }
      const data = (await response.json()) as UnsplashSearchResponse;
      return data.results?.[0] ?? null;
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";
      this.logger.warn({ event: "unsplash.search_error", query, message });
      return null;
    }
  }

  private toResult(photo: UnsplashPhoto): UnsplashResult {
    return {
      urls: {
        thumbnail: photo.urls.small,
        medium: photo.urls.regular,
        large: photo.urls.full,
      },
      autor: {
        name: photo.user.name,
        profileUrl: photo.user.links.html,
      },
      attribution: `Foto por ${photo.user.name} en Unsplash`,
      altRecibido: photo.alt_description ?? "",
    };
  }
}
