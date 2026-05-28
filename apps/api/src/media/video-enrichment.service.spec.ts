import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PexelsService } from "./pexels.service.js";
import { UnsplashService } from "./unsplash.service.js";
import { VideoEnrichmentService } from "./video-enrichment.service.js";

describe("VideoEnrichmentService", () => {
  const originalPexelsKey = process.env.PEXELS_API_KEY;
  const originalUnsplashKey = process.env.UNSPLASH_ACCESS_KEY;

  beforeEach(() => {
    process.env.PEXELS_API_KEY = "pk_test";
    process.env.UNSPLASH_ACCESS_KEY = "uk_test";
  });

  afterEach(() => {
    process.env.PEXELS_API_KEY = originalPexelsKey;
    process.env.UNSPLASH_ACCESS_KEY = originalUnsplashKey;
    vi.restoreAllMocks();
  });

  it("arma thumbnail + urlEmbed cuando hay embedId y marca verificado", async () => {
    const pexels = new PexelsService();
    const unsplash = new UnsplashService();
    const fetchSpy = vi.spyOn(pexels, "fetchThumbnail");
    const service = new VideoEnrichmentService(pexels, unsplash);

    const result = await service.enrich({
      queryBusqueda: "fotosintesis para chicos",
      titulo: "Cómo es la fotosíntesis",
      embedId: "abc123XYZ",
    });

    expect(result.verificado).toBe(true);
    expect(result.thumbnail).toBe("https://i.ytimg.com/vi/abc123XYZ/hqdefault.jpg");
    expect(result.urlEmbed).toBe("https://www.youtube.com/embed/abc123XYZ");
    expect(result.urlBusqueda).toContain("fotosintesis");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("cae a thumbnail ambiental de Pexels cuando no hay embedId", async () => {
    const pexels = new PexelsService();
    const unsplash = new UnsplashService();
    vi.spyOn(pexels, "fetchThumbnail").mockResolvedValue("https://pexels.test/amazonia.jpg");
    const service = new VideoEnrichmentService(pexels, unsplash);

    const result = await service.enrich({
      queryBusqueda: "Amazonia documental",
      titulo: "Documental Amazonia",
    });

    expect(result.verificado).toBe(false);
    expect(result.thumbnail).toBe("https://pexels.test/amazonia.jpg");
    expect(result.urlEmbed).toBeUndefined();
    expect(result.urlBusqueda).toContain("Amazonia");
  });

  it("cae a Unsplash si Pexels no devuelve thumbnail", async () => {
    const pexels = new PexelsService();
    const unsplash = new UnsplashService();
    vi.spyOn(pexels, "fetchThumbnail").mockResolvedValue(null);
    vi.spyOn(unsplash, "fetchThumbnail").mockResolvedValue("https://unsplash.test/forest.jpg");
    const service = new VideoEnrichmentService(pexels, unsplash);

    const result = await service.enrich({
      queryBusqueda: "selva tropical",
      titulo: "Selva tropical",
    });

    expect(result.thumbnail).toBe("https://unsplash.test/forest.jpg");
    expect(result.verificado).toBe(false);
  });

  it("deja thumbnail undefined cuando ninguna API trae nada", async () => {
    const pexels = new PexelsService();
    const unsplash = new UnsplashService();
    vi.spyOn(pexels, "fetchThumbnail").mockResolvedValue(null);
    vi.spyOn(unsplash, "fetchThumbnail").mockResolvedValue(null);
    const service = new VideoEnrichmentService(pexels, unsplash);

    const result = await service.enrich({
      queryBusqueda: "tema raro",
      titulo: "Sin imagen",
    });

    expect(result.thumbnail).toBeUndefined();
    expect(result.verificado).toBe(false);
    expect(result.urlBusqueda).toContain("tema");
  });
});
