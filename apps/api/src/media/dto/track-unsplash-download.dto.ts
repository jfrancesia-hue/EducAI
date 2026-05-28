import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches } from "class-validator";

/**
 * Body del endpoint `POST /media/track-download`.
 *
 * El frontend NO conoce la access key de Unsplash; el backend hace el GET
 * autenticado a `downloadLocation` para reportar el uso. Validamos que la
 * URL realmente pertenezca a `api.unsplash.com` para evitar que alguien use
 * el endpoint como proxy para llamar otras URLs arbitrarias con la key.
 */
export class TrackUnsplashDownloadDto {
  @ApiProperty({
    example: "https://api.unsplash.com/photos/abc123/download?ixid=...",
  })
  @IsString()
  @Matches(/^https:\/\/api\.unsplash\.com\//u, {
    message: "downloadLocation debe pertenecer a api.unsplash.com",
  })
  downloadLocation!: string;
}
