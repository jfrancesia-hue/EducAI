import { PlayCircle } from "lucide-react";

type VideoSugerido = {
  titulo?: string;
  busquedaYoutube?: string;
  criterioSeleccion?: string;
  momentoUso?: string;
  embedId?: string;
  urlEmbed?: string;
  urlBusqueda?: string;
  thumbnail?: string;
  verificado?: boolean;
};

type Props = {
  videos: VideoSugerido[];
  safeHttpUrl: (url: string | undefined | null) => string | undefined;
  youtubeSearchHref: (query: string) => string;
};

/**
 * Sección "Videos sugeridos" del detalle de la guía. Cada video muestra:
 *
 * - El thumbnail real (de YouTube si la guía tiene embedId, o "ambiental"
 *   de Pexels/Unsplash si no) con play overlay.
 * - Título + criterio pedagógico + momento de uso recomendado.
 * - CTA "Buscar en YouTube" hacia la búsqueda enriquecida del enrichment
 *   o, si no llegó, una búsqueda construida desde el query.
 *
 * Nunca embebe iframes inventados: si no tenemos un urlEmbed verificado,
 * el docente cae al search de YouTube en una nueva pestaña.
 */
export function SeccionVideos({ videos, safeHttpUrl, youtubeSearchHref }: Props) {
  if (!videos.length) return null;

  return (
    <div className="rounded-lg bg-white p-3">
      <div className="flex items-center gap-2 font-semibold">
        <PlayCircle className="h-4 w-4 text-[#087968]" aria-hidden="true" />
        Videos sugeridos
      </div>
      <div className="mt-3 grid gap-4">
        {videos.map((video, index) => {
          const safeThumb = safeHttpUrl(video.thumbnail);
          const safeSearchUrl = safeHttpUrl(video.urlBusqueda);
          const youTubeFallback = video.busquedaYoutube
            ? youtubeSearchHref(video.busquedaYoutube)
            : undefined;
          const linkHref = safeSearchUrl ?? youTubeFallback;

          return (
            <figure
              key={`${video.titulo}-${index}`}
              className="overflow-hidden rounded-lg border border-[#e3ebe7] bg-[#fbfffd]"
            >
              {safeThumb ? (
                <div className="relative">
                  <img
                    src={safeThumb}
                    alt={`Vista previa: ${video.titulo ?? "video sugerido"}`}
                    className="h-44 w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/15">
                    <PlayCircle
                      className="h-12 w-12 text-white drop-shadow-lg"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              ) : null}

              <figcaption className="p-3 text-[15px] leading-6">
                <p className="font-semibold text-[#11231f]">{video.titulo}</p>
                {video.criterioSeleccion ? (
                  <p className="mt-1 text-[#11231f]">
                    <span className="font-semibold">Criterio:</span> {video.criterioSeleccion}
                  </p>
                ) : null}
                {video.momentoUso ? (
                  <p className="mt-1 text-[#11231f]">
                    <span className="font-semibold">Uso:</span> {video.momentoUso}
                  </p>
                ) : null}

                {linkHref ? (
                  <a
                    href={linkHref}
                    target="_blank"
                    rel="noreferrer"
                    className="educai-no-export mt-2 inline-flex items-center gap-1 text-sm font-bold text-[#087968] underline-offset-4 hover:underline"
                  >
                    <PlayCircle className="h-4 w-4" aria-hidden="true" />
                    Buscar en YouTube
                  </a>
                ) : null}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </div>
  );
}
