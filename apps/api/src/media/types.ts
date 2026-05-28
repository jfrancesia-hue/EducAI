export type ImagenOrientacion = "horizontal" | "vertical" | "cuadrada";

/** Referencia abstracta a una imagen que el LLM puede incluir en una guía. */
export interface ImagenRef {
  /**
   * Proveedor preferido. El router puede reroutear si la API key no está disponible.
   * `wikimedia` y `banco_educai` quedan como hooks futuros; hoy degradan a ref sin URLs.
   */
  tipo: "pexels" | "unsplash" | "wikimedia" | "banco_educai";
  /** Búsqueda en lenguaje natural (en inglés suele rendir mejor). */
  query: string;
  /** Orientación deseada. Default "horizontal". */
  orientacion?: ImagenOrientacion;
  /** Alt text en español para accesibilidad. Requerido. */
  alt: string;
}

export interface ImagenAutor {
  name: string;
  profileUrl?: string;
}

export interface ImagenUrls {
  thumbnail: string;
  medium: string;
  large: string;
}

export interface ImagenEnriquecida extends ImagenRef {
  urls?: ImagenUrls;
  autor?: ImagenAutor;
  /** Atribución al proveedor según sus términos. */
  attribution?: string;
  /**
   * Solo para imágenes provistas por Unsplash. El frontend DEBE pegar
   * un GET autenticado a esta URL cuando renderiza la imagen por primera vez
   * (vía `POST /media/track-download`), para reportar el "uso" al fotógrafo
   * — es un requisito de las API guidelines de producción de Unsplash.
   */
  downloadLocation?: string;
}

/** Referencia abstracta a un video YouTube. */
export interface VideoRef {
  /** Búsqueda para mostrar al docente si el embed no funciona. */
  queryBusqueda: string;
  /** Título humano corto, generado por el LLM. */
  titulo: string;
  /** Resumen pedagógico breve. */
  resumen?: string;
  /** Si el LLM tiene certeza alta de un YouTube embedId. */
  embedId?: string;
  /** Pista visual para fallback cuando no hay thumbnail. */
  thumbnailHint?: string;
}

export interface VideoEnriquecido extends VideoRef {
  thumbnail?: string;
  urlEmbed?: string;
  /** Siempre presente: URL de búsqueda en YouTube como red de seguridad. */
  urlBusqueda: string;
  /** true si tenemos embed verificado por embedId. false si solo búsqueda. */
  verificado: boolean;
}
