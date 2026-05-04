export interface OcrResult {
  text: string;
  confidence: number;
}

export class OcrService {
  extractTextFromImage(imageUrl: string): Promise<OcrResult> {
    if (!imageUrl) {
      throw new Error("imageUrl is required");
    }

    return Promise.resolve({
      text: "Texto extraido pendiente de proveedor Vision",
      confidence: 0.75,
    });
  }
}
