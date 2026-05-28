import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ImageEnrichmentService } from "./image-enrichment.service.js";
import { PexelsService } from "./pexels.service.js";
import { UnsplashService } from "./unsplash.service.js";

const PEXELS_RESULT = {
  urls: { thumbnail: "https://pexels.test/thumb.jpg", medium: "m", large: "l" },
  autor: { name: "Foto Persona", profileUrl: "https://pexels.test/u" },
  attribution: "Foto por Foto Persona en Pexels",
  altRecibido: "students in classroom",
};

const UNSPLASH_RESULT = {
  urls: { thumbnail: "https://unsplash.test/thumb.jpg", medium: "m", large: "l" },
  autor: { name: "Foto Otra", profileUrl: "https://unsplash.test/u" },
  attribution: "Foto por Foto Otra en Unsplash",
  altRecibido: "kids learning",
};

describe("ImageEnrichmentService", () => {
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

  it("usa Pexels cuando la ref pide pexels y la key está configurada", async () => {
    const pexels = new PexelsService();
    const unsplash = new UnsplashService();
    const searchSpy = vi.spyOn(pexels, "search").mockResolvedValue(PEXELS_RESULT);
    const enricher = new ImageEnrichmentService(pexels, unsplash);

    const result = await enricher.enrich({
      tipo: "pexels",
      query: "students in classroom",
      alt: "Estudiantes en un aula",
    });

    expect(result.urls).toEqual(PEXELS_RESULT.urls);
    expect(result.tipo).toBe("pexels");
    expect(searchSpy).toHaveBeenCalled();
  });

  it("reroutea a Unsplash cuando la ref pide pexels pero Pexels no devuelve nada", async () => {
    const pexels = new PexelsService();
    const unsplash = new UnsplashService();
    vi.spyOn(pexels, "search").mockResolvedValue(null);
    vi.spyOn(unsplash, "search").mockResolvedValue(null);
    const enricher = new ImageEnrichmentService(pexels, unsplash);

    const result = await enricher.enrich({
      tipo: "pexels",
      query: "x",
      alt: "x",
    });

    // Devuelve la ref sin urls cuando nada matcheó.
    expect(result.urls).toBeUndefined();
  });

  it("reroutea a Pexels cuando la ref pide unsplash pero la key no está", async () => {
    process.env.UNSPLASH_ACCESS_KEY = "";
    const pexels = new PexelsService();
    const unsplash = new UnsplashService();
    const searchSpy = vi.spyOn(pexels, "search").mockResolvedValue(PEXELS_RESULT);
    const enricher = new ImageEnrichmentService(pexels, unsplash);

    const result = await enricher.enrich({
      tipo: "unsplash",
      query: "kids learning",
      alt: "Chicos aprendiendo",
    });

    expect(result.urls).toEqual(PEXELS_RESULT.urls);
    expect(searchSpy).toHaveBeenCalled();
  });

  it("devuelve la ref sin urls cuando ninguna API está configurada", async () => {
    process.env.PEXELS_API_KEY = "";
    process.env.UNSPLASH_ACCESS_KEY = "";
    const pexels = new PexelsService();
    const unsplash = new UnsplashService();
    const enricher = new ImageEnrichmentService(pexels, unsplash);

    const result = await enricher.enrich({
      tipo: "pexels",
      query: "x",
      alt: "x",
    });

    expect(result.urls).toBeUndefined();
    expect(result.alt).toBe("x");
  });

  it("prefiere Unsplash cuando el tipo es desconocido y ambas APIs están", async () => {
    const pexels = new PexelsService();
    const unsplash = new UnsplashService();
    const searchSpy = vi.spyOn(unsplash, "search").mockResolvedValue(UNSPLASH_RESULT);
    const enricher = new ImageEnrichmentService(pexels, unsplash);

    const result = await enricher.enrich({
      tipo: "wikimedia",
      query: "history map",
      alt: "Mapa",
    });

    expect(result.urls).toEqual(UNSPLASH_RESULT.urls);
    expect(searchSpy).toHaveBeenCalled();
  });
});
