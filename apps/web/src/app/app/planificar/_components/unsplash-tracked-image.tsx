"use client";

import { useEffect, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";

/**
 * Imagen de Unsplash que reporta su "uso" al backend la primera vez que se
 * monta. Es un requisito de las API guidelines de producción de Unsplash:
 * cada vez que la foto se renderiza de verdad en la app, hay que pegar un
 * GET al `links.download_location` que vino con el resultado del search.
 *
 * El backend en `apps/api` se encarga del fetch autenticado contra Unsplash
 * (el frontend no tiene la access key). Nosotros sólo le pasamos la URL al
 * endpoint `POST /media/track-download` con el Bearer del usuario.
 *
 * Cache local por documento: si la misma `downloadLocation` aparece en
 * varias imágenes (debería ser raro porque es por foto), sólo disparamos
 * el hit una vez por sesión del browser.
 */

type UnsplashTrackedImageProps = {
  src: string;
  alt: string;
  className?: string;
  downloadLocation?: string;
};

const seenDownloadLocations = new Set<string>();

export function UnsplashTrackedImage({
  src,
  alt,
  className,
  downloadLocation,
}: UnsplashTrackedImageProps) {
  const dispatched = useRef(false);

  useEffect(() => {
    if (dispatched.current) return;
    if (!downloadLocation) return;
    if (seenDownloadLocations.has(downloadLocation)) {
      dispatched.current = true;
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!apiUrl || !supabaseUrl || !supabaseAnonKey) return;

    dispatched.current = true;
    seenDownloadLocations.add(downloadLocation);

    const fire = async () => {
      try {
        const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        if (!accessToken) return;

        await fetch(`${apiUrl.replace(/\/$/u, "")}/media/track-download`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ downloadLocation }),
          cache: "no-store",
        });
      } catch {
        // Best-effort: si el tracking falla, la imagen ya se ve y no queremos
        // ensuciar la consola del docente con errores secundarios.
      }
    };

    void fire();
  }, [downloadLocation]);

  return <img src={src} alt={alt} className={className} loading="lazy" />;
}
