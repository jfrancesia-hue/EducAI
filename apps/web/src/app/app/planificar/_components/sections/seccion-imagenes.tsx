import { ImageIcon } from "lucide-react";

import { UnsplashTrackedImage } from "../unsplash-tracked-image";

type ImagenSugerida = {
  titulo?: string;
  descripcion?: string;
  usoDidactico?: string;
  busquedaSugerida?: string;
  urls?: { thumbnail?: string; medium?: string; large?: string };
  autor?: { name?: string; profileUrl?: string };
  attribution?: string;
  proveedor?: "pexels" | "unsplash";
  downloadLocation?: string;
};

type Props = {
  imagenes: ImagenSugerida[];
  safeHttpUrl: (url: string | undefined | null) => string | undefined;
  stockSearchHref: (provider: "pexels" | "unsplash", query: string) => string;
};

/**
 * Sección "Imágenes sugeridas" del detalle de la guía. Renderiza cada imagen
 * con su foto real de Pexels/Unsplash si el enriquecimiento (fase B) trajo
 * URLs; si no, degrada a metadata + botones de búsqueda en Pexels/Unsplash.
 *
 * Para imágenes de Unsplash usa `<UnsplashTrackedImage>` que reporta el
 * download al backend (requisito de producción de Unsplash).
 */
export function SeccionImagenes({ imagenes, safeHttpUrl, stockSearchHref }: Props) {
  if (!imagenes.length) return null;

  return (
    <div className="rounded-lg bg-white p-3">
      <div className="flex items-center gap-2 font-semibold">
        <ImageIcon className="h-4 w-4 text-[#087968]" aria-hidden="true" />
        Imágenes sugeridas
      </div>
      <div className="mt-3 grid gap-4">
        {imagenes.map((image, index) => {
          const safeImageUrl = safeHttpUrl(image.urls?.medium);
          const safeDownload = safeHttpUrl(image.downloadLocation);
          const safeProfileUrl = safeHttpUrl(image.autor?.profileUrl);
          const altText = image.descripcion ?? image.titulo ?? "Imagen sugerida";

          return (
            <figure
              key={`${image.titulo}-${index}`}
              className="overflow-hidden rounded-lg border border-[#e3ebe7] bg-[#fbfffd]"
            >
              {safeImageUrl ? (
                image.proveedor === "unsplash" ? (
                  <UnsplashTrackedImage
                    src={safeImageUrl}
                    alt={altText}
                    className="h-44 w-full object-cover"
                    downloadLocation={safeDownload}
                  />
                ) : (
                  <img
                    src={safeImageUrl}
                    alt={altText}
                    className="h-44 w-full object-cover"
                    loading="lazy"
                  />
                )
              ) : null}

              <figcaption className="p-3 text-[15px] leading-6">
                <p className="font-semibold text-[#11231f]">{image.titulo}</p>
                {image.descripcion ? (
                  <p className="mt-1 text-[#11231f]">{image.descripcion}</p>
                ) : null}
                {image.usoDidactico ? (
                  <p className="mt-1 text-[#11231f]">
                    <span className="font-semibold">Uso:</span> {image.usoDidactico}
                  </p>
                ) : null}

                {image.attribution ? (
                  <p className="mt-2 text-xs leading-5 text-[#5b6962]">
                    {safeProfileUrl ? (
                      <a
                        href={safeProfileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline-offset-4 hover:underline"
                      >
                        {image.attribution}
                      </a>
                    ) : (
                      image.attribution
                    )}
                  </p>
                ) : null}

                {!safeImageUrl && image.busquedaSugerida ? (
                  <div className="educai-no-export mt-2 flex flex-wrap gap-2">
                    <a
                      href={stockSearchHref("pexels", image.busquedaSugerida)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-[#eef5f3] px-3 py-1 text-sm font-bold text-[#087968] transition hover:bg-[#e7fbf7]"
                    >
                      Buscar en Pexels
                    </a>
                    <a
                      href={stockSearchHref("unsplash", image.busquedaSugerida)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-[#eef5f3] px-3 py-1 text-sm font-bold text-[#087968] transition hover:bg-[#e7fbf7]"
                    >
                      Buscar en Unsplash
                    </a>
                  </div>
                ) : null}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </div>
  );
}
