import Anthropic from "@anthropic-ai/sdk";

export interface OcrResult {
  text: string;
  confidence: number;
  modelUsed: string;
  tokensUsed: number;
  blurry?: boolean;
  unreadable?: boolean;
}

export interface OcrServiceOptions {
  apiKey?: string;
  model?: string;
  maxImageBytes?: number;
  fetchImpl?: typeof fetch;
  anthropic?: Anthropic;
}

const DEFAULT_MODEL = "claude-opus-4-7";
const DEFAULT_MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const OCR_SYSTEM_PROMPT = `Sos un OCR pedagógico para una plataforma educativa argentina destinada a menores. Tu única tarea es transcribir el ejercicio escolar visible en la imagen al español, preservando notación matemática (use ^, /, *, =), enunciados, opciones y diagramas descritos en palabras.

Reglas estrictas:
- Si la imagen es ilegible, está borrosa o no contiene un ejercicio escolar, respondé exactamente: UNREADABLE
- Si la imagen contiene contenido inapropiado para menores (violencia, sexual, drogas), respondé exactamente: BLOCKED
- No agregues explicaciones, no resuelvas el ejercicio, no opines.
- Si hay dibujos o diagramas, describí brevemente el diagrama en una línea entre corchetes: [Diagrama: triángulo rectángulo con catetos 3 y 4].
- Mantené el orden de lectura: enunciado primero, después opciones (a, b, c, d).`;

/**
 * Servicio OCR que usa Claude Vision para extraer texto de fotos
 * de ejercicios escolares enviadas por WhatsApp.
 *
 * Acepta URL HTTPS o data URI base64. Descarga con guard de tamaño
 * y media-type whitelist antes de enviar al modelo.
 */
export class OcrService {
  private readonly anthropic: Anthropic;
  private readonly model: string;
  private readonly maxImageBytes: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: OcrServiceOptions = {}) {
    this.anthropic =
      options.anthropic ??
      new Anthropic({
        apiKey: options.apiKey ?? process.env.ANTHROPIC_API_KEY,
      });
    this.model = options.model ?? DEFAULT_MODEL;
    this.maxImageBytes = options.maxImageBytes ?? DEFAULT_MAX_IMAGE_BYTES;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async extractTextFromImage(imageUrl: string): Promise<OcrResult> {
    if (!imageUrl) {
      throw new Error("imageUrl is required");
    }

    const { mediaType, base64 } = await this.loadImage(imageUrl);

    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 1024,
      system: OCR_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: "text",
              text: "Transcribí el ejercicio escolar de esta imagen. Devolvé solo la transcripción, sin resolver.",
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const rawText = textBlock && textBlock.type === "text" ? textBlock.text.trim() : "";

    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

    if (rawText === "UNREADABLE" || rawText === "") {
      return {
        text: "",
        confidence: 0.1,
        modelUsed: response.model,
        tokensUsed,
        unreadable: true,
        blurry: true,
      };
    }

    if (rawText === "BLOCKED") {
      return {
        text: "",
        confidence: 0,
        modelUsed: response.model,
        tokensUsed,
        unreadable: true,
      };
    }

    return {
      text: rawText,
      confidence: 0.9,
      modelUsed: response.model,
      tokensUsed,
    };
  }

  private async loadImage(imageUrl: string): Promise<{
    mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
    base64: string;
  }> {
    if (imageUrl.startsWith("data:")) {
      return this.parseDataUri(imageUrl);
    }

    if (!/^https?:\/\//i.test(imageUrl)) {
      throw new Error("Solo se aceptan URLs http(s) o data URIs base64");
    }

    const response = await this.fetchImpl(imageUrl);
    if (!response.ok) {
      throw new Error(`No se pudo descargar la imagen (${response.status})`);
    }

    const rawContentType = response.headers.get("content-type") ?? "image/jpeg";
    const contentType = (rawContentType.split(";")[0] ?? rawContentType).trim().toLowerCase();

    if (!ALLOWED_MEDIA_TYPES.has(contentType)) {
      throw new Error(`Tipo de imagen no permitido: ${contentType}`);
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > this.maxImageBytes) {
      throw new Error(`La imagen supera el límite de ${this.maxImageBytes} bytes`);
    }

    return {
      mediaType: contentType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
      base64: Buffer.from(buffer).toString("base64"),
    };
  }

  private parseDataUri(dataUri: string): {
    mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
    base64: string;
  } {
    const match = /^data:([^;]+);base64,(.+)$/i.exec(dataUri);
    if (!match || !match[1] || !match[2]) {
      throw new Error("Data URI inválido");
    }
    const mediaType = match[1].toLowerCase();
    if (!ALLOWED_MEDIA_TYPES.has(mediaType)) {
      throw new Error(`Tipo de imagen no permitido: ${mediaType}`);
    }
    const base64 = match[2];
    const decodedBytes = Buffer.from(base64, "base64").byteLength;
    if (decodedBytes > this.maxImageBytes) {
      throw new Error(`La imagen supera el límite de ${this.maxImageBytes} bytes`);
    }
    return {
      mediaType: mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
      base64,
    };
  }
}
