"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function ContinueToApp({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const route = nextPath as Route;

  useEffect(() => {
    router.replace(route);
  }, [route, router]);

  return (
    <Link href={route} className="mt-4 text-sm font-bold text-[#075f53] underline">
      Continuar ahora
    </Link>
  );
}
