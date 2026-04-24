export interface TranscriptionResult {
  text: string;
  language: string;
  durationSeconds?: number;
}

export class AudioService {
  async transcribe(audioUrl: string): Promise<TranscriptionResult> {
    if (!audioUrl) {
      throw new Error("audioUrl is required");
    }

    return {
      text: "Transcripcion pendiente de proveedor Whisper",
      language: "es-AR",
    };
  }
}

