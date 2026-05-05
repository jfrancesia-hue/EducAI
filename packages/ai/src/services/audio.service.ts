import OpenAI, { toFile } from "openai";

export interface TranscriptionResult {
  text: string;
  language: string;
  durationSeconds?: number;
  modelUsed: string;
}

export interface AudioServiceOptions {
  apiKey?: string;
  model?: string;
  defaultLanguage?: string;
  maxAudioBytes?: number;
  fetchImpl?: typeof fetch;
  openai?: OpenAI;
}

const DEFAULT_MODEL = "whisper-1";
const DEFAULT_LANGUAGE = "es";
const DEFAULT_MAX_AUDIO_BYTES = 25 * 1024 * 1024; // 25 MB (Whisper hard limit)
const ALLOWED_MEDIA_TYPES = new Set([
  "audio/mpeg",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/wav",
  "audio/x-wav",
  "audio/webm",
  "audio/ogg",
  "audio/oga",
  "audio/flac",
]);

/**
 * Servicio de transcripción de audios de WhatsApp con Whisper de OpenAI.
 * Usado para mensajes de voz que mandan los alumnos.
 *
 * Default: español argentino (es). Whisper detecta el dialecto automáticamente
 * dentro del español, así que "es" cubre es-AR, es-419, es-ES.
 */
export class AudioService {
  private readonly openai: OpenAI;
  private readonly model: string;
  private readonly defaultLanguage: string;
  private readonly maxAudioBytes: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: AudioServiceOptions = {}) {
    this.openai =
      options.openai ??
      new OpenAI({
        apiKey: options.apiKey ?? process.env.OPENAI_API_KEY,
      });
    this.model = options.model ?? DEFAULT_MODEL;
    this.defaultLanguage = options.defaultLanguage ?? DEFAULT_LANGUAGE;
    this.maxAudioBytes = options.maxAudioBytes ?? DEFAULT_MAX_AUDIO_BYTES;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async transcribe(audioUrl: string, language?: string): Promise<TranscriptionResult> {
    if (!audioUrl) {
      throw new Error("audioUrl is required");
    }

    if (!/^https?:\/\//i.test(audioUrl)) {
      throw new Error("Solo se aceptan URLs http(s) para audio");
    }

    const response = await this.fetchImpl(audioUrl);
    if (!response.ok) {
      throw new Error(`No se pudo descargar el audio (${response.status})`);
    }

    const rawContentType = response.headers.get("content-type") ?? "audio/mpeg";
    const contentType = (rawContentType.split(";")[0] ?? rawContentType).trim().toLowerCase();

    if (!ALLOWED_MEDIA_TYPES.has(contentType)) {
      throw new Error(`Tipo de audio no permitido: ${contentType}`);
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > this.maxAudioBytes) {
      throw new Error(`El audio supera el límite de ${this.maxAudioBytes} bytes`);
    }

    const filename = this.deriveFilename(audioUrl, contentType);
    const file = await toFile(Buffer.from(buffer), filename, { type: contentType });

    const transcription = await this.openai.audio.transcriptions.create({
      file,
      model: this.model,
      language: language ?? this.defaultLanguage,
      response_format: "verbose_json",
    });

    return {
      text: transcription.text.trim(),
      language: transcription.language ?? language ?? this.defaultLanguage,
      durationSeconds: transcription.duration,
      modelUsed: this.model,
    };
  }

  private deriveFilename(url: string, contentType: string): string {
    try {
      const parsed = new URL(url);
      const last = parsed.pathname.split("/").filter(Boolean).pop();
      if (last && /\.[a-z0-9]+$/i.test(last)) {
        return last;
      }
    } catch {
      // ignore
    }
    const ext = this.extensionFor(contentType);
    return `audio.${ext}`;
  }

  private extensionFor(contentType: string): string {
    switch (contentType) {
      case "audio/mpeg":
        return "mp3";
      case "audio/mp4":
      case "audio/m4a":
      case "audio/x-m4a":
        return "m4a";
      case "audio/wav":
      case "audio/x-wav":
        return "wav";
      case "audio/webm":
        return "webm";
      case "audio/ogg":
      case "audio/oga":
        return "ogg";
      case "audio/flac":
        return "flac";
      default:
        return "mp3";
    }
  }
}
